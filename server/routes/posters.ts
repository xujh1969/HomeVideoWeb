import express from 'express'
import fs from 'fs'
import path from 'path'
import { POSTER_DIR } from '../config'

const router = express.Router()

router.get('/:filename', (req, res) => {
  const { filename } = req.params
  const filePath = path.join(POSTER_DIR, filename)

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Poster not found')
  }

  const ext = path.extname(filename).toLowerCase()
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'

  res.setHeader('Content-Type', contentType)
  fs.createReadStream(filePath).pipe(res)
})

export default router
