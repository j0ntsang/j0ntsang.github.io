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
});

const Company = styled('section', {});

const CompanyName = styled('h4', {
  margin: 0,
});

const Role = styled('h5', {
  margin: '0 0 8px',
});

const ThinkificYear = styled('h6', {
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

const StyledListHeader = styled('li', {
  marginBottom: '16px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '.3px',
});

interface ListHeaderInterface {
  header: string;
}

const ListHeader: React.VFC<ListHeaderInterface> = ({ header }) => (
  <StyledListHeader aria-hidden="true">{header}</StyledListHeader>
);

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
        helping make the web more accessible &amp; usable for everyone.
      </P>
      <P>
        <strong>This project is a work in progress.</strong>
      </P>
    </ResumeHeader>
    <SectionHeading>Letters of recommendation</SectionHeading>
    <StyledUnorderedList>
      <ListHeader header="Thinkific" />
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
        <ThinkificYear>Year Five</ThinkificYear>
        <P>
          Actualizing my goals to work more directly with design i opted to move
          over to the design system team. Pairing with Nathan Shubert-Harbison,
          he and I were able to prioritize and address the overwhelming backlog
          of accessibility/usability concerns found across the product umbrella.
          Along-side our dedicated designer, Oliver Browne and the original
          creator of the TOGA design library, Leonardo Faria, we were able to
          craft a more strategic roadmap that focused on education and alignment
          of the wider engineering department.
        </P>
        <P>
          We then sought to implement a tool called React Scanner to collect
          data from 6 of our major properties. Using our CI/CD pipeline, we were
          able to analyze packages through Semaphore, store the JSONL output to
          AWS S3 bucket, port it into BigQuery Datawarehouse and build reports
          on Mode Analytics.
        </P>
      </RoleDetails>

      <Role>Senior Front End Engineer</Role>
      <RoleDetails>
        <RoleTimeframe dateTime="2020-10-01/2021-06-30">
          October 2020 &ndash; June 2021 · 9 mos
        </RoleTimeframe>
        <ThinkificYear>Year Four</ThinkificYear>
        <P>
          OUTLINE: Ramping up back-end skills. Bugs &amp; tasks. Course Player
          flexbox upgrades &amp; cross-browser compatibility. Stripe
          alias/package improvements. Dedicated onboarding buddy. I want to be a
          designer.
        </P>
      </RoleDetails>

      <Role>Intermediate Front End Engineer</Role>
      <RoleDetails>
        <RoleTimeframe dateTime="2017-04-17/2020-10-01">
          April 2017 &ndash; October 2020 · 3 yr 7 mos
        </RoleTimeframe>
        <ThinkificYear>Year Three</ThinkificYear>
        <P>
          OUTLINE: Growth. Test Champions. Ziming, Director of Product Growth
          and Experiment. Chuiee, Senior Product Designer. Primary Levers:
          Revenue & Retention
        </P>
        <ThinkificYear>Year Two</ThinkificYear>
        <P>
          With the release of site builder, it was clear the new focus was to
          help surface our offerings and value. Marketing began a new branding
          campaign strategy and with that a new website was needed. I worked
          very closely with both Andrea Merson (Creative Director) and Alex
          Harris (Sr. Marketing Designer) from ideation to deployment. To be
          more efficient, i merged the existing github pages (jekyll) and the
          blog instance on wpengine (wordpress), to one property using a
          developer-friendly service called Kinsta. Additional responsibilities
          included: device/browser compatibility testing, design &amp; code qa,
          deployment strategy, domain &amp; path forwarding, content audits.
          After all the cross-collaboration with engineering, core, marketing
          &amp; support surrounding the www project, it seemed there was a need
          for a company-wide resource in development. I reached out to Greg
          Smith (CEO/Co-Founder) about a new role for myself, "Internal Tools
          &amp; Support". He agreed but ultimately wanted me for the new Growth
          team.
        </P>
        <ThinkificYear>Year One</ThinkificYear>
        <P>
          The initial expectations of my role was centric to helping build upon
          the existing marketing website feature, "themes". The intent was to
          extend the existing liquid-based templating engine with more advanced
          &amp; dynamic customization options. Admittly, i spent a great deal of
          time referencing shopify documentation. Working closely with Nick
          Foster (Creative Director), we aimed to allow the customer to have a
          more user-friendly experience with the newly minted react-based site
          builder product, which later transitioned to the guidance of Mike Clay
          (Product Manager).
        </P>
        <P>
          The architecture of themes and site builder had it's ground-work and
          the team was growing; which unified design system, development slowed.
          I was then, happily, resourced to our marketing team to work on our
          www for some updates to the home &amp; feature pages.
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
