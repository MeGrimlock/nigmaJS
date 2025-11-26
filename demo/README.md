# NigmaJS Demo

This folder contains interactive demos for NigmaJS cryptography library.

## 🚀 Running the Demos

### ⚠️ Important: CORS Policy

The demos require loading dictionary files (JSON) which are blocked by browsers when opening HTML files directly (`file:///`). You **must** use a local HTTP server.

### Option 1: Using npm serve script (Recommended)

From the project root, run:

```bash
npm run serve
```

This will:
- Start a local HTTP server on `http://localhost:8080`
- Automatically open your browser
- Serve the demo folder with proper CORS headers

### Option 2: Using Python

If you have Python installed:

```bash
# Python 3
cd demo
python -m http.server 8080

# Python 2
cd demo
python -m SimpleHTTPServer 8080
```

Then open `http://localhost:8080` in your browser.

### Option 3: Using Node.js http-server

```bash
npx http-server demo -p 8080 -c-1
```

Then open `http://localhost:8080` in your browser.

### Option 4: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `demo/index.html`
3. Select "Open with Live Server"

## 📂 Available Demos

- **index.html** - Landing page with links to all demos
- **demo.html** - Interactive cipher playground (Basic Ciphers)
- **chain-demo.html** - Cipher chain builder
- **language-guesser.html** - Language detection tool
- **decryption-tool.html** - Automated decryption tool with dictionary validation

## 🔧 Troubleshooting

### "Failed to load dictionary" error

This error occurs when:
1. You're opening the HTML file directly (not using a server)
2. The dictionary files are not accessible

**Solution**: Use one of the server options above.

### Console shows CORS errors

**Solution**: Make sure you're accessing the demo via `http://localhost` and not `file:///`.

### Dictionary validation shows "undefined"

This happens when dictionaries fail to load. Check the browser console (F12) for errors and ensure you're using a local server.

## 📊 Dictionary Files

The demos use large dictionary files located in `demo/data/`:
- `english-dictionary.json` - 275k+ English words
- `spanish-dictionary.json` - 636k+ Spanish words
- `italian-dictionary.json` - 17k+ Italian words
- `french-dictionary.json` - 319k+ French words
- `portuguese-dictionary.json` - 182k+ Portuguese words
- `german-dictionary.json` - 66k+ German words

These files are loaded asynchronously when needed. The system automatically detects the language and loads the appropriate dictionary.

## 🎯 Development

To rebuild the library after making changes:

```bash
npm run build:prod
```

This will:
1. Update the version
2. Build the production bundle
3. Copy `nigma.min.js` to `demo/js/`

## 📝 Notes

- All demos use the bundled `nigma.min.js` from `demo/js/`
- Dictionary validation requires an active HTTP server
- For best performance, use Chrome or Firefox
- Open the browser console (F12) to see debug logs

