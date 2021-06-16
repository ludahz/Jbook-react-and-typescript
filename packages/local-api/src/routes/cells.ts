import express from 'express'
import fs from 'fs/promises'
import path from 'path'

interface Cell {
  id: string
  content: string
  type: 'text' | 'code'
}

export const createCellsRouter = (filename: string, dir: string) => {
  const router = express.Router()
  router.use(express.json())

  const fullPath = path.join(dir, filename)

  router.get('/cells', async (req, res) => {
    try {
      //Read the file
      const result = await fs.readFile(fullPath, { encoding: 'utf-8' })

      //Parse list of cells out of it
      //send list of cells back to browser
      res.send(JSON.parse(result))
    } catch (err) {
      //If read throws error,
      //inspect if it says file doesn't exist
      if (err.code === 'ENOENT') {
        //Add code to create file and add default cells
        await fs.writeFile(fullPath, '[]', 'utf-8')
        res.send([])
      } else {
        throw err
      }
    }
  })

  router.post('/cells', async (req, res) => {
    //Make sure file exists
    //If not , in this case the file will be created automatically

    //Take list of cells from the request object
    //serialize them
    const { cells }: { cells: Cell[] } = req.body
    //write the cells into the file
    await fs.writeFile(fullPath, JSON.stringify(cells), 'utf-8')

    res.send({ status: 200 })
  })

  return router
}
