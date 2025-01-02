
# **Meme Editor**

## Vector Graphics Editor in Your Browser

**Meme Editor** is a powerful, browser-based vector graphics editor designed for simplicity, flexibility, and creative freedom. Whether you're creating memes, editing diagrams, or exploring vector art, Meme Editor delivers a seamless design experience with no need for downloads or installations.

## **Key Features**

- **Essential Vector Tools**  
  Effortlessly create and manipulate basic shapes like rectangles, lines, and Bézier curves.

- **Drag-and-Drop Image Import**  
  Quickly add images to your canvas with an intuitive drag-and-drop interface.

- **AI-Powered Human Detection**  
  Utilizing TensorFlow, Meme Editor automatically detects human figures in images and converts them into mask paths, making it easy to isolate subjects for creative edits.

- **Image Effects**  
  Apply effects like blur, noise, and more to enhance or transform your images within the editor.

- **Versatile Usage**  
  Whether you're making a meme for social media or a professional diagram for work, Meme Editor adapts to your creative needs.

---

**Meme Editor** empowers creators of all levels to design and express ideas visually — right from their browser.


## Install

```
npm install
```


## Start web server

Start web server. Default port is **3013**

```
npm run server
```

or use other port

```
PORT=5000 npm run server
```

[Open in browser](http://127.0.0.1:3013)


## Start desktop app

```
npm start
```

or if it doesn't work on Windows inside VM

```
npm run vm
```


## Build

1. Install **webpack** globally if not installed already

```
npm install -g webpack
```

2. Build javascript code

```
npm run build
```

### Desktop package

```
npm run package
```

the package will be generated in **out** directory

> Note: Not tested for Windows


## Demo

[Open editor](https://www.sipme.io/memed)


## Next

* Stroke **tapered ends**
* Circle/ellipse object
* Fill gradient
* SVG import
* Object grouping
* Better handling of curve's node manipulation
* Undo/Redo functionality 
* Animations


## Known issues

* History Undo/Redo functionality is not completed
* SVG files are imported as images rather than objects
* SVG bubble export


### Windows

WebGL is not working in VM. Not tested on Windows host machine


## In Loving Memory of Marina Nedeva 💖

| ![Picture of Marina](public/ui/png/marina.png) | This project is dedicated to the memory of Marina, my dearest friend, an extraordinary software developer, and a kind, inspiring soul who left an indelible mark on both this work and my life. <br><br> Her contributions to this project showcase her dedication to clean code, her problem-solving skills, and her commitment to excellence. Her friendship and professional brilliance will always be remembered. |
|------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------


### Her Contribution

Marina was not just a collaborator; she was the heart of many of our ideas and innovations. Her exceptional skills in software development, her dedication to clean, efficient code, and her keen problem-solving abilities elevated every project we worked on together. 

She was more than a teammate; she was a visionary who approached every challenge with creativity and determination. Many features and functionalities of this project are a testament to her talent and perseverance. Her ability to simplify complex concepts and her passion for sharing knowledge made her an invaluable mentor and partner.

### Her Spirit

Beyond her technical brilliance, Marina was a source of light and positivity. She had a way of turning late-night coding sessions into cherished memories, filled with laughter, insight, and encouragement. Her kindness, patience, and empathy touched everyone who had the privilege of knowing her.

To me, she was not just a friend but a sister in spirit. She believed in lifting others up, celebrating their successes, and always pushing for excellence in everything she did.

### A Legacy of Friendship and Excellence

Though her time with us was far too short, Marina leaves behind a legacy of dedication, innovation, and friendship. This project, and so many others we collaborated on, are a reflection of her love for technology and her desire to make the world a better place through her work.

I hope that as you use and contribute to this project, you feel a sense of the passion and joy that she poured into it. Her work will continue to inspire and guide us, just as her friendship will always remain in our hearts.

---

May her memory live on through the code she crafted, the ideas she brought to life, and the lives she touched. 💖

## Donation

We hope you've found our software useful. As a non-profit organization, we rely on the generosity of people like you to continue our mission of creating free/OS software

If you've found our work valuable and would like to support us, please consider making a donation. Your contribution, no matter the size, will make a meaningful difference in the lives of those we serve

Thank you for considering supporting us. Together, we can make a positive impact on our community/world

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XUSKMVK55P35G)
