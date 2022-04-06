export default function handler(req, res) {

  const cloudsTokenId = req.query.tokenId;


  res.status(200).json({
    name: "10 Clouds #" + cloudsTokenId,
    description: "10 Clouds Governance Membership",
    image: "https://gateway.pinata.cloud/ipfs/QmbSczPDoXKzed8XzbDFmugvHefubRHapECwsYVzng5AJm",
  });
}
