import * as esbuild from 'esbuild-wasm'
import axios from 'axios'
import loacalForage from 'localforage'

const fileCache = loacalForage.createInstance({
  name: 'filecache',
})

export const fetchPlugin = (inputCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /(^index\.js$)/ }, () => {
        return {
          loader: 'jsx',
          contents: inputCode,
        }
      })

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        // check to see if we have already fetched this file
        // and if it is in the cache
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        )

        //if it is, return it immmediately
        if (cachedResult) {
          return cachedResult
        }
      })

      build.onLoad({ filter: /.css$/ }, async (args: any) => {
        //otherwise allow our request to occur

        const { data, request } = await axios.get(args.path)

        const escaped = data
          .replace(/\n/g, '')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'")
        const contents = `
          const style = document.createElement('style');
          style.innerText = '${escaped}';
          document.head.appendChild(style);
        `

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname,
        }
        //store response in cache

        await fileCache.setItem(args.path, result)

        return result
      })

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        //otherwise allow our request to occur

        const { data, request } = await axios.get(args.path)

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        }
        //store response in cache

        await fileCache.setItem(args.path, result)

        return result
      })
    },
  }
}
