import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './main'

const root = createRoot(document.getElementById('root-container')!)

root.render(<App />)
