//Helper function to convert your admin sdk json to a base64 string.
// This string could be added to environment variables and read from there to
// use in the app. Safer this way to keep the repo public and still deploy in a PAAS.

//! NOTE: Delete the json from here before you push the changes to any public repo.

var res = Buffer.from(
  JSON.stringify("<paste your firebase-admin-sdk.json here>").toString("base64")
);

console.log(res);
