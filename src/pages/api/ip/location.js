export default async function handler(req, res) {
  if (req.method === "GET") {
    const ip = req.query.ip;
    const result = await fetch(`https://www.geolocation.com/?ip=${ip}#ipresult`)
    const html = await result.text();
    res.status(200).send(html)
  }
  
}