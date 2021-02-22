module.exports = {
  "mount": {
    "src": "/"
  },
  "optimize": {
    "target": "es2018",
    "minify": true
  },
  "packageOptions": {
    "rollup": {
      "plugins": [require('rollup-plugin-pnp-resolve')()],
    },
  },
}