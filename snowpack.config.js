// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: {
      url: "/",
      dot: true
    }
  },
  "optimize": {
    "target": "es2018",
    "minify": true
  },
  "packageOptions": {
  },
  buildOptions: {
    out: "docs"
  }
}