const express = require("express")
const cors = require("cors")
const youtubedl = require("youtube-dl-exec")
const ffmpegPath = require("ffmpeg-static")

youtubedl.exec("", {
  update: true
}).catch(()=>{})

const app = express()
app.use(cors())

function limpiarURL(url){

    const match = url.match(/v=([^&]+)/)

    if(match){
        return "https://www.youtube.com/watch?v=" + match[1]
    }

    return url
}

app.get("/formats", async (req, res) => {

    try {

        let url = limpiarURL(decodeURIComponent(req.query.url))

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            geoBypass: true,
            extractorArgs: "youtube:player_client=android",
            addHeader: [
                "User-Agent:com.google.android.youtube/17.31.35 (Linux; U; Android 11)"
            ]
        })

        const formats = (info.formats || [])
        .filter(f => f.ext === "mp4" && f.height && f.vcodec !== "none")
        .map(f => ({
            calidad: f.height + "p",
            id: f.format_id,
            height: f.height
        }))
        .sort((a,b)=>b.height-a.height)

        res.json({
            titulo: info.title,
            miniatura: info.thumbnail,
            formatos: formats
        })

    } catch(err){

        console.error(err)

        res.status(500).json({
            error: "No se pudo obtener el video"
        })

    }

})

app.get("/download", async (req, res) => {

    try {

        let url = limpiarURL(req.query.url)
        const format = req.query.format

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true
        })

        const title = info.title.replace(/[^\w\s]/gi, "")

        const stream = youtubedl.exec(url, {
            format: `${format}+bestaudio/best`,
            output: "-",
            mergeOutputFormat: "mp4",
            ffmpegLocation: ffmpegPath
        })

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${title}.mp4"`
        )

        stream.stdout.pipe(res)

        stream.stderr.on("data", console.error)

    } catch(err) {

        console.log(err)
        res.status(500).send("Error descargando")

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