import { text, h1, h2, h3, h4, div, p, ul, li, a, textArea, button, img, select, option } from './ui/lib/ui-core';
import { Route } from './router';
import { removeDuplicateLinesRoute, removeDuplicateLinesRoute2 } from './ui/remove-duplicate-lines';
import * as plainTextEditor from './ui/plain-text-editor';
import { appList, languageList } from './ui/ui-components';
import { changeSubdomain, except, getSubdomain, getUrlWithNewSubdomain, isDevEnv, removeAccents } from './util';

import './ui/style.css'

import { commands } from './commands';
import { gtag, initGoogleAnalytics } from './analytics';
import { getFirstSupportedPreferredLanguage, getLanguage, MaybeLocalizedString, setLanguage, setStrings, toLocalizedString, translate } from './localization';
import { strings } from './strings';
import { mkRouteFromCommand } from './ui/command-view';

const appElem = document.getElementById('app')!;
let routeContainerElem: HTMLElement;

function renderPageTemplate() {
  appElem.append(
    div([
      div({ class: 'header' }, [
        div([
          h1({ class: 'logo' }, [
            a({ href: '/' }, [
              img({ src: 'favicon.svg', alt: 'Free App Kit' }),
              text('freeappkit.com', /* disableTranslation: */ true)
            ])
          ]),
          h2({ class: 'tag-line' }, [
            text(strings.freeWebApplications)
          ])
        ]),
        div({ class: 'support-us-container' }, [
          select({ value: getLanguage(), onChange: changeLocale, style: "margin-bottom: 1rem;" }, [
            option({ value: 'en' }, [text('English')]),
            option({ value: 'es' }, [text('Español')]),
          ]),
          button({ style: "margin-bottom: 1rem;" }, [
            a({ href: 'https://www.patreon.com/bePatron?u=4644571', target: "_blank", class: 'patreon-button' }, [text('Support us on Patreon!')])
          ])
        ])
      ]),
      (routeContainerElem = div({ id: "route-container" })),
      div([
        p([text('Our apps:')]),
        appList()
      ]),
      div([
        p([text('Supported languages:')]),
        languageList()
      ])
    ])
  );

  function changeLocale(e: Event) {
    const selectElem = e.target as HTMLSelectElement;
    const newLocale = selectElem.value;
    const pathname = decodeURIComponent(window.location.pathname);
    const [route, _] = findRouteAndLocale(pathname);
    const localizedPathname = toLocalizedString(route.pathname) as any;

    if (localizedPathname[newLocale] !== undefined) {
      const newUrl = getUrlWithNewSubdomain(new URL(window.location.href), undefined);
      newUrl.pathname = localizedPathname[newLocale];
      window.location.href = newUrl.href;
    } else {
      changeSubdomain(newLocale);
    }
  }

  // HACK: find child select elements of appElem, and re-set their values to get the right option to be selected
  const selectElems = appElem.querySelectorAll('select');
  selectElems.forEach(selectElem => {
    const valueAttr = selectElem.getAttribute('value');

    if (valueAttr !== null) {
      selectElem.value = valueAttr;
    }
  });
}


// #region Pages

const mkHomePage = () =>
  div([]);

function mkNotFoundPage() {
  return text('Page not found!');
}

// #endregion Pages

// #region Router

const routes: Route[] = [
  {
    pathname: '/',
    title: undefined,
    mkPageElem: mkHomePage,
  },
  
  removeDuplicateLinesRoute,
  removeDuplicateLinesRoute2,
  plainTextEditor.route,
  ...commands.map(mkRouteFromCommand)
  //...plainTextEditor.plainTextEditorCommands.map(plainTextEditor.mkRouteFromPlainTextEditorCommand),
  //...except(commands, plainTextEditor.plainTextEditorCommands).map(mkRouteFromCommand)
];

const notFoundRoute: Route = {
  pathname: '/page-not-found',
  title: 'Page Not Found',
  mkPageElem: mkNotFoundPage,
};

function findRouteAndLocale(pathname: string): [Route, string | undefined] {
  const pathnamesToRouteAndLocales: { [pathname: string]: [Route, string] } = {};
  
  for (const route of routes) {
    const localizedPathname = toLocalizedString(route.pathname);

    for (const locale in localizedPathname) {
      const pathname = (localizedPathname as any)[locale];

      if (pathnamesToRouteAndLocales[pathname] !== undefined) {
        throw new Error(`Duplicate pathname: ${pathname}`);
      }
      
      pathnamesToRouteAndLocales[pathname] = [route, locale];
      
      const normalizedPathname = removeAccents(pathname);
      if (normalizedPathname !== pathname) {
        pathnamesToRouteAndLocales[normalizedPathname] = [route, locale];
      }
    }
  }

  if (pathnamesToRouteAndLocales[pathname] !== undefined) {
    const routeAndLocale = pathnamesToRouteAndLocales[pathname];
    const route = routeAndLocale[0];
    
    if (pathname === '/') {
      return [route, undefined];
    } else {
      return routeAndLocale;
    }
  } else {
    return [notFoundRoute, undefined];
  }
}

function selectLocale(localeFromRoute: string | undefined) {
  const subdomain = getSubdomain();
  if ((subdomain !== undefined) && (subdomain !== 'www')) {
    return subdomain;
  }
  
  if (localeFromRoute !== undefined) {
    return localeFromRoute;
  }

  return getFirstSupportedPreferredLanguage();
}

function changeRoute(pathname: string) {
  setStrings(strings);
  
  let [route, localeFromRoute] = findRouteAndLocale(pathname);

  const locale = selectLocale(localeFromRoute);
  setLanguage(locale);
  
  renderPageTemplate();

  document.title = (route.title !== undefined)
    ? `${translate(route.title)} - Free App Kit`
    : 'Free App Kit';

  // Send page view to Google Analytics now that the page title is set.
  if (!isDevEnv()) {
    initGoogleAnalytics();

    gtag('event', 'page_view');
    gtag('event', 'conversion', {
      'send_to': 'AW-16763524210/YqTZCObdg-UZEPKovLk-',
      'value': 1.0,
      'currency': 'USD'
    });
  }

  setPageElem(route.mkPageElem());
}

// #endregion Router

function run() {
  changeRoute(decodeURIComponent(location.pathname));
}

function setPageElem(pageElem: Node) {
  routeContainerElem.replaceChildren(pageElem);
}

run();