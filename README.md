# Jonathan Tsang's GitHub Portfolio/Resume

## Built With
Based on the project: [Single Page Apps for GitHub Pages](https://github.com/rafgraph/spa-github-pages) by [Rafael Pedicini](https://github.com/rafgraph)

### Development environment

I have included `webpack-dev-server` for testing changes locally. It can be accessed by running `$ npm start` (details below). Note that `webpack-dev-server` automatically creates a new bundle whenever the source files change and serves the bundle from memory, so you'll never see the bundle as a file saved to disk.

- `$ npm start` runs the [start script][startscript] in `package.json`, which runs the command `$ webpack-dev-server --host 0.0.0.0 --disable-host-check --open`
  - `--host 0.0.0.0 --disable-host-check` is so you can access the site on your local network from other devices at `http://[YOUR COMPUTER'S IP ADDRESS]:8080`
  - `--open` will open automatically open the site in your browser
- `webpack-dev-server` will serve `index.html` at `http://localhost:8080` (port `8080` is the default). Note that you must load the `index.html` from the server and not just open it directly in the browser or the scripts won't load.
