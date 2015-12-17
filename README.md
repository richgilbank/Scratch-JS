## Scratch JS

### What is it?
It's a Chrome DevTools extension ([available here](https://chrome.google.com/webstore/detail/scratch-js/alploljligeomonipppgaahpkenfnfkn)) that allows you to execute ES6/ES2015 code in the context of the page you're viewing, as though it were the standard DevTools console.

[Also available for Opera](https://addons.opera.com/en/extensions/details/es6-repl/?display=en)

### How do I use it?
Once you familiarize yourself with some of the concepts and features of ES6/ES2015, [install](https://chrome.google.com/webstore/detail/scratch-js/alploljligeomonipppgaahpkenfnfkn) the extension. You'll then notice the `Scratch JS` tab inside DevTools (⌘-⌥-i on a Mac, ctrl-⇧-i on a PC). You can toggle console visibility with `esc`, and code can be executed either by clicking the _Run it_ button, or using ⌘-↩ on a Mac, ctrl-↩ on a PC.

### How does it work?
It uses one of two engines to transpile ES6/ES2015 to good-old-fashioned ES5: Google's [Traceur](https://github.com/google/traceur-compiler) and [Babel](https://github.com/babel/babel/). Select which one you want to use from the Settings panel. If there's a feature you want to use that isn't working, check the [compatibility table](http://kangax.github.io/compat-table/es6/) under those 2 columns to see if it's been implemented yet. 

### But why?
Both [Traceur](https://google.github.io/traceur-compiler/demo/repl.html#) and Babel](https://babeljs.io/) already have their own REPLs. Why make a Chrome extension? For me it was just the convenience of being able to read a blog about a new feature or syntax and try it right there while I'm reading the article. Pop open the DevTools on the side of the page and give'r.

![](https://s3.amazonaws.com/f.cl.ly/items/2b0E2v0L1z2z060j2l0m/scratch2.jpg)

### Contributing and local development
To get it running locally, you'll need to clone the repo, install gulp and other project dependencies, then run the gulp task:

```shell
git clone git@github.com:richgilbank/Scratch-JS.git && cd Scratch-JS
npm install -g gulp
npm install
gulp
```

You'll then need to install it locally in Chrome. Go to the URL `chrome://extensions` and select "Developer mode", then click "Load unpacked extension..." and select the root directory of the project. 

The gulp task will reload the panel every time you make a change to a file in the `panel` directory.

Happy development!

=========================

Traceur is released under an [Apache 2.0 license](https://github.com/google/traceur-compiler/blob/master/LICENSE) and Babel is released under [MIT](https://github.com/babel/babel/blob/master/LICENSE). They belong to their respective owners. 

Everything else here is [MIT](https://github.com/richgilbank/ES6-Repl-Chrome-Extension/blob/master/LICENSE.md).
