import * as React from 'react';
import { DisabledLink } from '../ui/DisabledLink';
import { P } from '../ui/Paragraph';
import { styled } from '../stitches.config';

const ResumeHeader = styled('header', {
  marginBottom: '32px',
  '@media (min-width: 768px)': {
    marginBottom: '60px',
  },
});

const PreviousRole = styled('h2', {
  fontSize: '1.25rem',
});

const SectionHeading = styled('h3', {
  fontSize: '1.25rem',
  fontWeight: '300',
  textTransform: 'uppercase',
});

const Company = styled('section', {});

const CompanyName = styled('h4', {
  margin: 0,
});

const Role = styled('h5', {
  margin: '0 0 8px',
});

const YearHeading = styled('h6', {
  margin: 0,
});

const RoleTimeframe = styled('time', {});

const City = styled('address', {});

const RoleDetails = styled('section', {});

const StyledUnorderedList = styled('ul', {
  marginBottom: '40px',
  padding: '0 0 0 16px',
  listStyle: 'none',
});

const StyledListItem = styled('li', {
  marginBottom: '8px',
  paddingLeft: '16px',
});

export const Resume: React.VFC = () => (
  <>
    <ResumeHeader>
      <PreviousRole>
        Former Senior Design System Engineer at Thinkific
      </PreviousRole>
      <P>
        Looking forward to the next opportunity that allows me to continue
        helping make the web more accessible &amp; usable for everyone.&nbsp;
        <strong>This project is a work in progress.</strong>
      </P>
    </ResumeHeader>
    <SectionHeading>Letters of recommendation</SectionHeading>
    <P>Coming soon!</P>
    <StyledUnorderedList>
      <StyledListItem>
        <DisabledLink aria-disabled="true">
          Greg Smith, Co-Founder &amp; CEO
        </DisabledLink>
      </StyledListItem>
      <StyledListItem>
        <DisabledLink aria-disabled="true">
          Miranda Lievers, Co-Founder &amp; COO
        </DisabledLink>
      </StyledListItem>
      <StyledListItem>
        <DisabledLink aria-disabled="true">
          Tia Fomenoff, Senior Director - People and Culture
        </DisabledLink>
      </StyledListItem>
    </StyledUnorderedList>
    <SectionHeading>Experience</SectionHeading>
    <Company>
      <CompanyName>Thinkific</CompanyName>
      <City>Vancouver, BC</City>
      <Role>Senior Design System Engineer</Role>
      <RoleDetails>
        <RoleTimeframe dateTime="2021-06-01/2022-03-30">
          June 2021 &ndash; March 2022 · 10 mos
        </RoleTimeframe>
        <YearHeading>Year Five</YearHeading>
        <P>
          Actualizing my goals to work more directly with Design I opted to move
          over to the design system team ("TOGA"). Pairing with Nathan
          Shubert-Harbison, he and I were able to prioritize and address the
          overwhelming backlog of accessibility/usability concerns found across
          the product. With lead from our Designer, Oliver Browne, and the
          original creator of the TOGA design library, Leonardo Faria, we
          crafted a more strategic roadmap that focused on education and
          alignment of Engineering with design guidelines &amp; needs.
        </P>
        <P>
          We then sought to implement a tool called React Scanner to collect
          data from across 6 of our major properties. Using the CI/CD pipeline,
          we were able to analyze packages via Semaphore, store the JSONL output
          to an AWS S3 bucket, ingest with BigQuery and build visualization
          reports on Mode Analytics.
        </P>
      </RoleDetails>

      <Role>Senior Front End Engineer</Role>
      <RoleDetails>
        <RoleTimeframe dateTime="2020-10-01/2021-06-30">
          October 2020 &ndash; June 2021 · 9 mos
        </RoleTimeframe>
        <YearHeading>Year Four</YearHeading>
        <P>
          Seeing the benefit in experimentation, we aimed to bring the growth
          mentality to all other departments. It was adopted heavily by
          Marketing ICs and new technologies were implemented to facilitate
          experimentation within Product &amp; Engineering. After another great
          Black Friday campaign, I sought to focus on being a more well-rounded
          developer; honing my backend skills and addressing a wide-range of
          bugs and quick wins that never found scope on other teams. One task in
          particular being a complete audit and resolve for the main
          application, Course Player. It was a legacy build that required lots
          of flexbox upgrades &amp; TLC for cross-browser compatibility. The
          team was also the entry point for onboarding developers, so pairing
          with new-hires was an ongoing responsibility and opportunity for
          better understanding mentorship.
        </P>
      </RoleDetails>

      <Role>Intermediate Front End Engineer</Role>
      <RoleDetails>
        <RoleTimeframe dateTime="2017-04-17/2020-10-01">
          April 2017 &ndash; October 2020 · 3 yr 7 mos
        </RoleTimeframe>
        <YearHeading>Year Three</YearHeading>
        <P>
          2019 was a big year. Our Marketing team was flourishing with projects
          that reached beyond just supporting our customers. It was about
          telling their stories. The engineering team cabled to that momentum by
          starting a Growth team. Ziming Yang was brought on as Director of
          Product Growth and Experimentation and Chuiee Yang as our dedicated
          Senior Product Designer. We formed a small team that facilitated a
          number of experiments in both our core app and marketing tools. We
          implemented a system of Test Champions, acting as our own Project
          Management for the individual experiments, while still collaborating
          with each other and the broader organization. We made impacts and
          gathered information that benefited everyone, with a strong focus on
          the main levers of revenue &amp; retention.
        </P>
        <YearHeading>Year Two</YearHeading>
        <P>
          With the release of Site Builder, there was a need to surface our
          offerings and value. Marketing began a new branding campaign strategy
          and with that a new website was needed. I worked closely with both
          Andrea Merson (Creative Director) and Alex Harris (Sr. Marketing
          Designer) from ideation to deployment. To be more efficient, I merged
          the existing GitHub pages (Jekyll) and the blog instance on WPEngine
          (Wordpress), into one property using the developer-friendly service,
          Kinsta. Additional responsibilities included: Device/browser
          compatibility testing, design &amp; code QA, deployment strategy,
          domain &amp; path forwarding (smart redirects!), and flagging content
          audits.
        </P>
        <P>
          After all the cross-collaboration with engineering, core, marketing
          &amp; support surrounding the WWW project, it seemed there was a need
          for a company-wide resource in development. I reached out to Greg
          Smith (CEO/Co-Founder) about creating a new role for myself. He agreed
          but ultimately wanted me for something bigger. That's when he told me
          about "The Flywheel".
        </P>
        <YearHeading>Year One</YearHeading>
        <P>
          The initial expectations of my role was centric to helping build upon
          the existing website marketing feature, "Themes". The intent was to
          extend the existing liquid-based templating engine with more advanced
          &amp; dynamic customization options. Admittly, I spent a great deal of
          time referencing shopify documentation. Working closely with Nick
          Foster (Creative Director), we aimed to provide the customer a
          user-friendly experience in the newly minted react-based Site Builder
          product, which later transitioned to the guidance of Mike Clay
          (Product Manager).
        </P>
        <P>
          With the architecture of Themes &amp; Site Builder ground-work laid,
          and team growth thriving, development slowed. While a unified design
          was being built, I was resourced to our marketing team to work on our
          WWW for some updates to the Home &amp; Feature pages.
        </P>
      </RoleDetails>
    </Company>
    <Company>
      <CompanyName>Kellett Communications</CompanyName>
      <Role>Full Stack Developer</Role>
      <City>Yellowknife, Northwest Territories</City>
      <RoleTimeframe dateTime="2016-10-01/2017-03-31">
        October 2016 &ndash; March 2017 · 6 mos
      </RoleTimeframe>
      <P>
        Responsible for determining and planning architecture, layout, scoping
        projects, estimating hours, reviewing all materials, including checking
        estimates and specifications. Other duties include technical leadership
        and accountability with clients. Overseeing freelance &amp; partner web
        developers. Code reviews, beta testing and final product delivery.
        Support and communication with directors towards technical solutions to
        maintain creative process and vision. Maintenance contracts or
        engagements. Working with account managers to successfully manage client
        relationships.
      </P>
    </Company>
    <Company>
      <CompanyName>Outcrop Communications Ltd.</CompanyName>
      <Role>Web Developer</Role>
      <City>Yellowknife, Northwest Territories</City>
      <RoleTimeframe dateTime="2015-06-01/2011-09-30">
        June 2015 &ndash; Sept 2016 · 1 yr 4 mos
      </RoleTimeframe>
      <P>
        Originally signed to task for front-end development of theming and
        functionality; expanding needs lead to cover any and all areas that
        required immediate action or to close up the divide. Responsibilities
        ranged from troubleshooting both local and remote server environments to
        hotfix compatibility issues. Auditing existing deployments for security
        &amp; maintenance. Headed a number of projects, working closely with our
        design team members. Handled the design process for an expansion to one
        of the larger clients site portfolio (WSCC). Other duties include
        detailing technical documentation, site planning/wireframing,
        best-practice &amp; process standards innovation and new-hires support.
      </P>
    </Company>
  </>
);
