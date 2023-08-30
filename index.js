const express = require("express");
const https = require("https");
const fs = require("fs");
const axios = require("axios");
const app = express();
const port = 443; // Puerto en el que escuchará el servidor

const nodes = [
  "https://engine.deathwing.me",
  "https://enginerpc.com",
  "https://herpc.dtools.dev",
  "https://ctpmain.com",
  "https://he.atexoras.com:2083",
  "https://herpc.liotes.com",
  "https://herpc.tribaldex.com",
  "https://engine.hive.pizza",
  "https://api.primersion.com",
  "https://engine.rishipanthee.com",
  "https://api.primersion.com",
  "https://api.hive-engine.com",
  "https://api2.hive-engine.com",
  "https://herpc.actifit.io",
  "https://api.primersion.com",
];

const privateKey = fs.readFileSync(
  "/etc/letsencrypt/live/nodo.hivekings.io/privkey.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "/etc/letsencrypt/live/nodo.hivekings.io/cert.pem",
  "utf8"
);
const ca = fs.readFileSync(
  "/etc/letsencrypt/live/nodo.hivekings.io/chain.pem",
  "utf8"
);

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

async function findAvailableNode() {
  for (const node of nodes) {
    try {
      const response = await axios.get(node);
      if (response.status === 200) {
        return node;
      }
    } catch (error) {
      // Si hay un error, el nodo no está disponible
      console.log("ningun nodo disponible");
    }
  }
  return null; // Ningún nodo disponible
}

app.all("*", async (req, res) => {
  const requestUrl = (await findAvailableNode()) + req.url;
  const method = req.method; // Obtenemos el método de la solicitud

  req.headers.host = "nodo.hivekings.io"; // Cambiamos el host por el de nuestro dominio
  try {
    const response = await axios.request({
      url: requestUrl,
      method: method, // Usamos el método de la solicitud original
      data: req.body, // Pasamos los datos de la solicitud si es necesario
      headers: req.headers,
    });

    res.send(response.data);
  } catch (error) {
    console.error(error);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send("Error al procesar la solicitud");
    }
  }
});

// Crea un servidor HTTPS utilizando los certificados y claves
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
