import * as React from 'react';
import { Switch, Route } from 'react-router-dom';
import { DarkModeButton } from './ui/DarkModeButton';
import { GitHubIconLink } from './ui/GitHubIconLink';
import { globalCss, styled } from './stitches.config';
import { Home } from './components/Home';
import { PageNotFound } from './components/PageNotFound';

const AppContainer = styled('div', {
  width: '100%',
  padding: '24px 16px 40px',
  margin: '0 auto',
  '@media (min-width: 768px)': {
    maxWidth: '768px',
  },
});

const HeaderContainer = styled('header', {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
});

const H1 = styled('h1', {
  fontSize: '32px',
});

const HeaderIconContainer = styled('span', {
  width: '78px',
  display: 'inline-flex',
  justifyContent: 'space-between',
  gap: '12px',
});

const BreadcrumbsNav = styled('nav', {
  margin: '18px 0',
});

export const App: React.VFC = () => {
  globalCss();

  return (
    <AppContainer>
      <HeaderContainer>
        <H1>Jonathan Tsang</H1>
        <HeaderIconContainer>
          <DarkModeButton />
          <GitHubIconLink
            href="https://github.com/j0ntsang"
            title="GitHub repository for SPA GitHub Pages"
          />
        </HeaderIconContainer>
      </HeaderContainer>

      <Switch>
        <Route exact path="/" component={Home} />
        <Route component={PageNotFound} />
      </Switch>
    </AppContainer>
  );
};
