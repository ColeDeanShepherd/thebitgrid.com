import { text, h1, h2, h3, h4, div, p, ul, li, a, textArea, button, i, span } from './ui-core';
import { Route } from './router';
import { shuffleLines } from './util';
import { copyToClipboardButton } from './ui-components';

const mkRandomizeLinesPage = () => {
  let inputElem: HTMLTextAreaElement;
  let outputElem: HTMLTextAreaElement;

  const page = div([
    h2([
      text('Randomize (Shuffle) Lines')
    ]),
    div([
      h3([text('Input')]),
      (inputElem = textArea({ style: 'min-height: 300px' })),
      button({ onClick: onSubmit }, [text('Randomize')]),
    ]),
    div([
      h3([
        text('Output'),
        copyToClipboardButton(() => outputElem)
      ]),
      (outputElem = textArea({ readonly: true, style: 'min-height: 300px' })),
    ]),
  ]);

  return page;

  function onSubmit() {
    outputElem.value = shuffleLines(inputElem.value);
  }
}

export const randomizeLinesRoute: Route = {
  pathname: '/randomize-lines',
  title: 'Randomize (Shuffle) Lines',
  mkPageElem: mkRandomizeLinesPage,
};