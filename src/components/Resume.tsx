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
        helping make the web more accessible &amp; usable for everyone.{' '}
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
          over to the design system team ("TOGA"). Pairing with{' '}
          <a
            href="https://www.linkedin.com/in/nathanshubertharbison/"
            target="_blank"
            aria-label="Opens a new tab to Nathan's LinkedIn profile"
          >
            Nathan Shubert-Harbison
          </a>
          , he and I were able to prioritize and address the overwhelming
          backlog of accessibility/usability concerns found across the product.
          With lead from our Designer,{' '}
          <a
            href="https://www.linkedin.com/in/oliverbrowne91/"
            target="_blank"
            aria-label="Opens a new tab to Oliver's LinkedIn profile"
          >
            Oliver Browne
          </a>
          , and the original creator of the TOGA design library,{' '}
          <a
            href="https://www.linkedin.com/in/leonardofariacoelho/"
            target="_blank"
            aria-label="Opens a new tab to Leo's LinkedIn profile"
          >
            Leonardo Faria
          </a>
          , we crafted a more strategic roadmap that focused on education and
          alignment of Engineering to Design guidelines &amp; needs.
        </P>
        <P>
          We then sought to implement a tool called{' '}
          <a
            href="https://github.com/moroshko/react-scanner"
            target="_blank"
            aria-label="Opens a new tab to React Scanner on GitHub"
          >
            React Scanner
          </a>{' '}
          to collect data from across 6 of our major properties to better
          understand our frontend technologies. Using the CI/CD pipeline, we
          analyzed packages via Semaphore, stored the JSONL output to an AWS S3
          bucket, ingested them with BigQuery and built visualization reports on
          Mode Analytics...
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
          Marketing ICs and new technologies were added to pave the way for
          experimentation within Product &amp; Engineering. After another great
          Black Friday campaign, I leaned focus on being a more well-rounded
          developer; honing my backend skills and helping to address a
          wide-range of bugs and quick wins that never found scope on other
          teams. One task in particular being a complete audit and resolve for
          the main application, Course Player. It was a legacy build that
          required lots of flexbox upgrades &amp; TLC for cross-browser
          compatibility. The team was also the entry point for onboarding
          developers, so pairing with new-hires was an ongoing responsibility
          and opportunity for better understanding mentorship, with guidance
          from my own mentor{' '}
          <a
            href="https://www.linkedin.com/in/evelynmah/"
            target="_blank"
            aria-label="Opens a new tab to Evelyn's LinkedIn profile"
          >
            Evelyn Mah
          </a>
          .
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
          starting a Growth team.{' '}
          <a
            href="https://www.linkedin.com/in/zimingyang/"
            target="_blank"
            aria-label="Opens a new tab to Ziming's LinkedIn profile"
          >
            Ziming Yang
          </a>{' '}
          was brought on as Director of Product Growth and Experimentation. We
          were gifted some of the best design talent available,{' '}
          <a
            href="https://www.linkedin.com/in/yangchungwon/"
            target="_blank"
            aria-label="Opens a new tab to Chuiee's LinkedIn profile"
          >
            Chuiee Yang
          </a>
          , as our dedicated Senior Product Designer. We formed a small team
          that facilitated a number of experiments in both our core app and
          marketing tools. We implemented a system of Test Champions, acting as
          our own Project Management for the individual experiments, while still
          collaborating with each other and the broader team. We made
          long-standing impacts and gathered information to the benefit of
          everyone, with a strong focus on the main levers of revenue &amp;
          retention.
        </P>
        <YearHeading>Year Two</YearHeading>
        <P>
          With the eventual release of Site Builder, there was a clear need to
          surface our offerings and value. Marketing began a new branding
          campaign strategy and with that came the need for a new website. I
          worked closely with both{' '}
          <a
            href="https://www.linkedin.com/in/andreamerson/"
            target="_blank"
            aria-label="Opens a new tab to Andrea's LinkedIn profile"
          >
            Andrea Merson (Creative Director)
          </a>{' '}
          and{' '}
          <a
            href="https://www.linkedin.com/in/alexharrisdesign/"
            target="_blank"
            aria-label="Opens a new tab to Alex's LinkedIn profile"
          >
            Alex Harris (Sr. Marketing Designer)
          </a>{' '}
          from ideation to deployment. To be more efficient, I merged the
          existing GitHub pages and WordPress blog, into one site, and moved it
          over to the developer-friendly service, Kinsta. Additional
          responsibilities included:{' '}
          <strong>
            <em>
              Device/browser compatibility testing, design &amp; code QA,
              deployment strategy, domain &amp; path forwarding (smart
              redirects!), content audits.
            </em>
          </strong>
        </P>
        <P>
          After all the cross-collaboration with Engineering, CORE, Marketing
          &amp; Customer Support, while on the WWW project, I detected a lack of
          company-wide resources in development. I reached out to{' '}
          <a
            href="https://www.linkedin.com/in/gregsmith-thinkificceo/"
            target="_blank"
            aria-label="Opens a new tab to Greg's LinkedIn profile"
          >
            Greg Smith (CEO/Co-Founder)
          </a>{' '}
          about creating a new role for myself. He agreed but ultimately wanted
          me for something bigger.
          <br />
          <br />
          That's when he told me about "The Flywheel".
        </P>
        <YearHeading>Year One</YearHeading>
        <P>
          The initial expectations of my role was centric to helping build upon
          the existing website marketing feature, "Themes". The intent was to
          extend the existing liquid-based templating engine with more advanced
          &amp; dynamic customization options. Admittedly, I spent a great deal
          of time referencing shopify documentation. Working closely with{' '}
          <a
            href="https://www.linkedin.com/in/nickfostr/"
            target="_blank"
            aria-label="Opens a new tab to Nick's LinkedIn profile"
          >
            Nick Foster (Creative Director)
          </a>
          , we aimed to provide the customer with a more modern user-friendly
          experience with what became Thinkific's first react-based product,
          Site Builder. Leadership was later transitioned to{' '}
          <a
            href="https://www.linkedin.com/in/michael-clay-3a90a310/"
            target="_blank"
            aria-label="Opens a new tab to Mike's LinkedIn profile"
          >
            Mike Clay (Product Manager)
          </a>
          .
        </P>
        <P>
          Although the ground-work architecture of Themes &amp; Site Builder was
          laid and team growth was thriving, development slowed. I was resourced
          to our Marketing team to work on our{' '}
          <a
            href="https://www.thinkific.com/"
            target="_blank"
            aria-label="Opens a new tab to Thinkific.com"
          >
            WWW
          </a>{' '}
          for some much needed updates on the Home &amp; Feature pages.
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
