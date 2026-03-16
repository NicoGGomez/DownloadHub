async function buscar(){

    const url = document.getElementById("url").value

    try {

        const res = await fetch(
            "http://localhost:3000/formats?url=" + encodeURIComponent(url)
        )

        const data = await res.json()

        let html = `
            <div class="contenedor contenedor-info-video">
            <h3>${data.titulo}</h3>
            <img src="${data.miniatura}" width="300"></div>
            <br><br>

            <div class="contenedor contenedor-calidad">
            <p>MP3</p>
            <a href="http://localhost:3000/downloadmp3?url=${encodeURIComponent(url)}">
                <button>Descargar MP3</button>
            </a>
            </div>

            <br><br>

            <div class="contenedor contenedor-calidad">
            <p>MP4</p>
            <div class="contenedor-calidad-video">
        `

        data.formatos.forEach(f => {

            html += `
                <a href="http://localhost:3000/download?url=${encodeURIComponent(url)}&format=${f.id}">
                    <button>${f.calidad}</button>
                </a>
            `

        })

        html+= `</div>
                </div>`

        document.getElementById("video").innerHTML = html

    } catch(err){

        document.getElementById("video").innerHTML =
        "<p>Error obteniendo el video</p>"

        console.error(err)

    }

}