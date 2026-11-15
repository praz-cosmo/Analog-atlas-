// ANALOG ATLAS — Express backend
// Node.js 18+. NASA Images API proxy; no NASA API key required for image search.
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = process.env.PORT || 3000;
const here = path.dirname(fileURLToPath(import.meta.url));
const cache = new Map();
const TTL = 10 * 60 * 1000;

app.disable("x-powered-by");
app.use(express.json({limit:"30kb"}));
app.use(express.static(path.join(here,"public")));

const clean = (v,max=120) => String(v ?? "").trim().slice(0,max);

app.get("/api/health", (_req,res) => {
  res.json({status:"ok", project:"ANALOG ATLAS", version:"1.0.0",
    services:{nasaImages:"NASA Image and Video Library proxy"}});
});

// Live NASA Image and Video Library search.
// NASA source: https://images-api.nasa.gov/search
app.get("/api/nasa/search", async (req,res) => {
  const q = clean(req.query.q);
  const page = Math.max(1,Math.min(20,Number.parseInt(req.query.page || "1",10)||1));
  const media = ["image","video","audio"].includes(req.query.media_type) ? req.query.media_type : "image";
  if(q.length<2) return res.status(400).json({error:"Enter at least two characters."});
  const key = `${q.toLowerCase()}|${page}|${media}`;
  const old = cache.get(key);
  if(old && Date.now()-old.time<TTL) return res.json({...old.value,cached:true});

  try {
    const url = new URL("https://images-api.nasa.gov/search");
    url.searchParams.set("q",q);
    url.searchParams.set("media_type",media);
    url.searchParams.set("page",String(page));
    url.searchParams.set("page_size","12");
    const upstream = await fetch(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(15000)});
    if(!upstream.ok) return res.status(502).json({error:`NASA archive responded with HTTP ${upstream.status}.`});
    const raw = await upstream.json();
    const items = (raw.collection?.items || []).map(item=>{
      const d=item.data?.[0] || {};
      const preview=(item.links||[]).find(x=>x.rel==="preview" && x.href)?.href
        || (item.links||[]).find(x=>x.href)?.href || "";
      return {
        nasaId:d.nasa_id || "", title:d.title || "Untitled NASA item",
        description:String(d.description || "").replace(/<[^>]*>/g," ").slice(0,600),
        dateCreated:d.date_created || "", center:d.center || "NASA",
        photographer:d.photographer || "", keywords:d.keywords || [],
        image:preview, mediaType:d.media_type || media,
        nasaUrl:d.nasa_id ? `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id)}` : "https://images.nasa.gov/"
      };
    }).filter(x=>x.image);
    const value={query:q,page,mediaType:media,totalHits:raw.collection?.metadata?.total_hits ?? null,items,source:"NASA Image and Video Library",cached:false,fetchedAt:new Date().toISOString()};
    cache.set(key,{time:Date.now(),value});
    res.json(value);
  } catch(err) {
    res.status(504).json({error:"NASA's archive could not be reached. Check the connection and try again."});
  }
});

const pages = {"/":"index.html","/explorer":"explorer.html","/worlds":"worlds.html","/imagery":"imagery.html","/map":"map.html","/gallery":"gallery.html","/research":"research.html"};
app.get("*",(req,res)=>{
  const page = pages[req.path];
  if(page) return res.sendFile(path.join(here,"public",page));
  res.status(404).sendFile(path.join(here,"public","index.html"));
});
app.listen(PORT,()=>console.log(`ANALOG ATLAS running at http://localhost:${PORT}`));
