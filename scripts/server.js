const express = require("express")
const cors = require("cors")

const app = express()
app.use(cors())

const INSTANCES = [
 "https://pipedapi.kavin.rocks",
 "https://pipedapi.in.projectsegfau.lt",
 "https://pipedapi.namazso.eu"
]

app.get("/formats", async (req, res) => {

 try{

    const url = req.query.url

    const videoUrl = new URL(url)
    const videoId = videoUrl.searchParams.get("v")

    if(!videoId){
        return res.status(400).json({error:"URL inválida"})
    }

    const data = await getStreams(videoId)

    if(!data){
        return res.status(500).json({error:"No hay instancias disponibles"})
    }

    const formats = (data.videoStreams || []).map(v => ({
        calidad: v.quality,
        url: v.url
    }))

    res.json({
        titulo: data.title,
        miniatura: data.thumbnailUrl,
        formatos: formats
    })

 }catch(err){

    console.error(err)

    res.status(500).json({
        error:"Error interno"
    })

 }

})

app.get("/downloadmp3", (req, res) => {

    let url = limpiarURL(req.query.url)

    const stream = youtubedl.exec(url, {
        extractAudio: true,
        audioFormat: "mp3",
        output: "-"
    })

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="audio.mp3"`
    )

    stream.stdout.pipe(res)

})

async function getStreams(videoId){

 for(const instance of INSTANCES){

  try{

   console.log("probando:", instance)

   const response = await fetch(
    `${instance}/api/v1/streams/${videoId}`
   )

   if(!response.ok) continue

   const text = await response.text()

   if(!text.startsWith("{")){
     console.log("no es json:", instance)
     continue
   }

   const data = JSON.parse(text)

   console.log("funciona:", instance)

   return data

  }catch(e){
   console.log("falló instancia:", instance)
  }

 }

 return null
}


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Servidor corriendo en " + PORT)
})