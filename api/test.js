export default function handler(req, res) { res.status(200).json({ env: Object.keys(process.env) }); }
