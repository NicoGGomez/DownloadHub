const express = require("express")
const cors = require("cors")

const app = express()
app.use(cors())

const INSTANCES = [
 "https://pipedapi.kavin.rocks",
 "https://pipedapi.adminforge.de",
 "https://pipedapi.tokhmi.xyz"
]

app.get("/formats", async (req, res) => {

    try {

        const url = req.query.url
        const videoId = url.split("v=")[1].split("&")[0]

        let data = null

        for(const instance of INSTANCES){

            try{

                const response = await fetch(
                    `${instance}/api/v1/streams/${videoId}`
                )

                if(response.ok){
                    data = await response.json()
                    break
                }

            }catch(e){
                console.log("falló instancia:", instance)
            }

        }

        if(!data){
            return res.status(500).json({
                error: "No hay instancias disponibles"
            })
        }

        const formats = (data.videoStreams || []).map(v => ({
            calidad: v.quality,
            id: v.url
        }))

        res.json({
            titulo: data.title,
            miniatura: data.thumbnailUrl,
            formatos: formats
        })

    } catch(err){

        console.error(err)

        res.status(500).json({
            error: "No se pudo obtener el video"
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

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Servidor corriendo en " + PORT)
})