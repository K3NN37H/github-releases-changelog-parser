import React from 'react'
import ReactDOM from 'react-dom'

import App from './main'

function simpleComp() {
  return (
    <App />
  )
}

ReactDOM.render(simpleComp(), document.getElementById('root-container'))
