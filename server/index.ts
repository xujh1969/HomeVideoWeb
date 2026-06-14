import express from 'express'
import cors from 'cors'
import path from 'path'
import { PORT } from './config'
import { initDatabase } from './db'
import moviesRouter from './routes/movies'
import seriesRouter from './routes/series'
import homeRouter from './routes/home'
import sourcesRouter from './routes/sources'
import libraryRouter from './routes/library'
import streamRouter from './routes/stream'
import postersRouter from './routes/posters'
import genresRouter from './routes/genres'

const app = express()

function startServer() {
  initDatabase()
  
  app.use(cors())
  app.use(express.json())

  app.use('/api/movies', moviesRouter)
  app.use('/api/series', seriesRouter)
  app.use('/api/home', homeRouter)
  app.use('/api/sources', sourcesRouter)
  app.use('/api/library', libraryRouter)
  app.use('/api/stream', streamRouter)
  app.use('/api/posters', postersRouter)
  app.use('/api/genres', genresRouter)

  app.use(express.static(path.join(__dirname, '../client/dist')))

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'))
  })

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer()