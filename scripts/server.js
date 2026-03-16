const express = require("express")
const cors = require("cors")

const youtubedl = require("youtube-dl-exec").create({
    binaryPath: require("youtube-dl-exec/bin/yt-dlp")
})

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

    let url = decodeURIComponent(req.query.url)
    url = limpiarURL(url)
    // url = url.split("&")[0]
    const tipo = req.query.tipo
    const calidad = req.query.calidad

    try {

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true
        })

        const title = info.title.replace(/[^\w\s]/gi, "")


        const formats = info.formats
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

    } catch (err) {
        res.status(500).send("error")
    }

})

app.get("/download", async (req, res) => {

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
        ffmpegLocation: "ffmpeg"
    })

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${title}.mp4"`
    )

    stream.stdout.pipe(res)

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