import React, { useState } from "react";

import AppContainer from "../../templates/AppContainer";
import ResumeHeader from "./components/ResumeHeader";
import MyName from "./components/MyName";
import Tagline from "./components/Tagline";
import PreviousRole from "./components/PreviousRole";
import MissionStatement from "./components/MissionStatement";
import SectionHeading from "./components/SectionHeading";
import SectionDivider from "./components/SectionDivider";
import Company from "./components/Company";
import CompanyName from "./components/CompanyName";
import CompanyDetails from "./components/CompanyDetails";
import Role from "./components/Role";
import RoleDivider from "./components/RoleDivider";
import RoleDetails from "./components/RoleDetails";
import RoleDescription from "./components/RoleDescription";
import RoleTimeframe from "./components/RoleTimeframe";
import RoleDescriptionHeading from "./components/RoleDescriptionHeading";
import PreviousWorkExperience from "./components/PreviousWorkExperience";
import TogglePreviousWork from "./components/TogglePreviousWork";
import {
  SkillsFocusWrapper,
  SkillsFocusList,
  SkillsFocusListHeading,
  SkillsFocusListItem,
} from "./components/SkillsFocus";

export const Resume: React.VFC = () => {
  const [showPreviousWork, setShowPreviousWork] = useState(false);

  return (
    <AppContainer>
      <ResumeHeader>
        <MyName>Jonathan Tsang</MyName>
        <Tagline>A11y Advocate & CSS Connoisseur</Tagline>
        <PreviousRole>
          Former Senior Design System Engineer at Thinkific
        </PreviousRole>
        <MissionStatement>
          Looking forward to the next opportunity that allows me to continue
          helping make the web more accessible &amp; usable for everyone.{" "}
          <strong>This project is a work in progress.</strong>
        </MissionStatement>
      </ResumeHeader>
      <SectionHeading>Recent Experience</SectionHeading>
      <Company>
        <CompanyName>Thinkific Labs Inc.</CompanyName>
        <CompanyDetails>
          Education Technology · Vancouver, BC · 5 years
        </CompanyDetails>
        <Role>Senior Design System Engineer</Role>
        <RoleDetails>
          <RoleTimeframe dateTime="2021-06-01/2022-03-30">
            June 2021 &ndash; March 2022
          </RoleTimeframe>
          <RoleDescriptionHeading>Year Five</RoleDescriptionHeading>
          <RoleDescription>
            Actualizing my goals to work more directly with Design I opted to
            move over to the design system team ("TOGA"). Pairing with{" "}
            <a
              href="https://www.linkedin.com/in/nathanshubertharbison/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Nathan's LinkedIn profile"
            >
              Nathan Shubert-Harbison
            </a>
            , he and I were able to prioritize and address the overwhelming
            backlog of accessibility/usability concerns found across the
            product. With lead from our Designer,{" "}
            <a
              href="https://www.linkedin.com/in/oliverbrowne91/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Oliver's LinkedIn profile"
            >
              Oliver Browne
            </a>
            , and the original creator of the TOGA design library,{" "}
            <a
              href="https://www.linkedin.com/in/leonardofariacoelho/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Leo's LinkedIn profile"
            >
              Leonardo Faria
            </a>
            , we crafted a more strategic roadmap that focused on education and
            alignment of Engineering to Design guidelines &amp; needs.
          </RoleDescription>
          <RoleDescription>
            We then sought to implement a tool called{" "}
            <a
              href="https://github.com/moroshko/react-scanner"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to React Scanner on GitHub"
            >
              React Scanner
            </a>{" "}
            to collect data from across 6 of our major properties to better
            understand our frontend technologies. Using the CI/CD pipeline, we
            analyzed packages via Semaphore, stored the JSONL output to an AWS
            S3 bucket, ingested them with BigQuery and built visualization
            reports on Mode Analytics...
          </RoleDescription>
          <RoleDescriptionHeading>Skill Focus</RoleDescriptionHeading>
          <SkillsFocusWrapper>
            <SkillsFocusList>
              <SkillsFocusListHeading>Languages</SkillsFocusListHeading>
              <SkillsFocusListItem>CSS/HTML</SkillsFocusListItem>
              <SkillsFocusListItem>React</SkillsFocusListItem>
              <SkillsFocusListItem>TypeScript</SkillsFocusListItem>
            </SkillsFocusList>
            <SkillsFocusList>
              <SkillsFocusListHeading>
                Build-chain &amp; Frameworks
              </SkillsFocusListHeading>
              <SkillsFocusListItem>Gatsby</SkillsFocusListItem>
              <SkillsFocusListItem>Webpack</SkillsFocusListItem>
              <SkillsFocusListItem>React Scanner</SkillsFocusListItem>
            </SkillsFocusList>
            <SkillsFocusList>
              <SkillsFocusListHeading>
                Apps &amp; Services
              </SkillsFocusListHeading>
              <SkillsFocusListItem>GitHub</SkillsFocusListItem>
              <SkillsFocusListItem>Semaphore</SkillsFocusListItem>
              <SkillsFocusListItem>AWS</SkillsFocusListItem>
              <SkillsFocusListItem>Mode Analytics</SkillsFocusListItem>
            </SkillsFocusList>
          </SkillsFocusWrapper>
        </RoleDetails>

        <RoleDivider />

        <Role>Senior Front End Engineer</Role>
        <RoleDetails>
          <RoleTimeframe dateTime="2020-10-01/2021-06-30">
            October 2020 &ndash; June 2021
          </RoleTimeframe>
          <RoleDescriptionHeading>Year Four</RoleDescriptionHeading>
          <RoleDescription>
            Seeing the benefit in experimentation, we aimed to bring the growth
            mentality to all other departments. It was adopted heavily by
            Marketing ICs and new technologies were added to pave the way for
            experimentation within Product &amp; Engineering. After another
            great Black Friday campaign, I leaned focus on being a more
            well-rounded developer; honing my backend skills and helping to
            address a wide-range of bugs and quick wins that never found scope
            on other teams. One task in particular being a complete audit and
            resolve for the main application, Course Player. It was a legacy
            build that required lots of flexbox upgrades &amp; TLC for
            cross-browser compatibility. The team was also the entry point for
            onboarding developers, so pairing with new-hires was an ongoing
            responsibility and opportunity for better understanding mentorship,
            with guidance from my own mentor{" "}
            <a
              href="https://www.linkedin.com/in/evelynmah/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Evelyn's LinkedIn profile"
            >
              Evelyn Mah
            </a>
            .
          </RoleDescription>
          <RoleDescriptionHeading>Skill Focus</RoleDescriptionHeading>
          <SkillsFocusWrapper>
            <SkillsFocusList>
              <SkillsFocusListHeading>Languages</SkillsFocusListHeading>
              <SkillsFocusListItem>CSS/HTML</SkillsFocusListItem>
              <SkillsFocusListItem>React</SkillsFocusListItem>
              <SkillsFocusListItem>Ember</SkillsFocusListItem>
              <SkillsFocusListItem>Ruby On Rails</SkillsFocusListItem>
            </SkillsFocusList>
            <SkillsFocusList>
              <SkillsFocusListHeading>
                Framework &amp; Platform
              </SkillsFocusListHeading>
              <SkillsFocusListItem>WordPress/PHP</SkillsFocusListItem>
              <SkillsFocusListItem>Kinsta</SkillsFocusListItem>
            </SkillsFocusList>
            <SkillsFocusList>
              <SkillsFocusListHeading>Cloud Services</SkillsFocusListHeading>
              <SkillsFocusListItem>CodeClimate</SkillsFocusListItem>
              <SkillsFocusListItem>LaunchDarkly</SkillsFocusListItem>
            </SkillsFocusList>
          </SkillsFocusWrapper>
        </RoleDetails>

        <RoleDivider />

        <Role>Intermediate Front End Engineer</Role>
        <RoleDetails>
          <RoleTimeframe dateTime="2017-04-17/2020-10-01">
            April 2017 &ndash; October 2020
          </RoleTimeframe>
          <RoleDescriptionHeading>Year Three</RoleDescriptionHeading>
          <RoleDescription>
            2019 was a big year. Our Marketing team was flourishing with
            projects that reached beyond just supporting our customers. It was
            about telling their stories. The engineering team cabled to that
            momentum by starting a Growth team.{" "}
            <a
              href="https://www.linkedin.com/in/zimingyang/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Ziming's LinkedIn profile"
            >
              Ziming Yang
            </a>{" "}
            was brought on as Director of Product Growth and Experimentation. We
            were gifted some of the best design talent available,{" "}
            <a
              href="https://www.linkedin.com/in/yangchungwon/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Chuiee's LinkedIn profile"
            >
              Chuiee Yang
            </a>
            , as our dedicated Senior Product Designer. We formed a small team
            that facilitated a number of experiments in both our core app and
            marketing tools. We implemented a system of Test Champions, acting
            as our own Project Management for the individual experiments, while
            still collaborating with each other and the broader team. We made
            long-standing impacts and gathered information to the benefit of
            everyone, with a strong focus on the main levers of revenue &amp;
            retention.
          </RoleDescription>
          <RoleDescriptionHeading>Skill Focus</RoleDescriptionHeading>
          <SkillsFocusWrapper>
            <SkillsFocusList>
              <SkillsFocusListHeading>Languages</SkillsFocusListHeading>
              <SkillsFocusListItem>CSS/HTML</SkillsFocusListItem>
              <SkillsFocusListItem>React</SkillsFocusListItem>
              <SkillsFocusListItem>Svelte</SkillsFocusListItem>
              <SkillsFocusListItem>Ruby On Rails</SkillsFocusListItem>
              <SkillsFocusListItem>Ember</SkillsFocusListItem>
            </SkillsFocusList>
            <SkillsFocusList>
              <SkillsFocusListHeading>
                Apps &amp; Services
              </SkillsFocusListHeading>
              <SkillsFocusListItem>Reforge: Growth Series</SkillsFocusListItem>
              <SkillsFocusListItem>AppCues</SkillsFocusListItem>
              <SkillsFocusListItem>Mixpanel</SkillsFocusListItem>
            </SkillsFocusList>
            <SkillsFocusList>
              <SkillsFocusListHeading>
                Build-chain &amp; Frameworks
              </SkillsFocusListHeading>
              <SkillsFocusListItem>Webpack</SkillsFocusListItem>
              <SkillsFocusListItem>RollupJS</SkillsFocusListItem>
              <SkillsFocusListItem>WordPress/PHP</SkillsFocusListItem>
            </SkillsFocusList>
          </SkillsFocusWrapper>
          <SectionDivider />
          <RoleDescriptionHeading>Year Two</RoleDescriptionHeading>
          <RoleDescription>
            With the eventual release of Site Builder, there was a clear need to
            surface our offerings and value. Marketing began a new branding
            campaign strategy and with that came the need for a new website. I
            worked closely with both{" "}
            <a
              href="https://www.linkedin.com/in/andreamerson/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Andrea's LinkedIn profile"
            >
              Andrea Merson (Creative Director)
            </a>{" "}
            and{" "}
            <a
              href="https://www.linkedin.com/in/alexharrisdesign/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Alex's LinkedIn profile"
            >
              Alex Harris (Sr. Marketing Designer)
            </a>{" "}
            from ideation to deployment. To be more efficient, I merged the
            existing GitHub pages and WordPress blog, into one site, and moved
            it over to the developer-friendly service, Kinsta. Additional
            responsibilities included:{" "}
            <strong>
              <em>
                Device/browser compatibility testing, design &amp; code QA,
                deployment strategy, domain &amp; path forwarding (smart
                redirects!), content audits.
              </em>
            </strong>
          </RoleDescription>
          <RoleDescription>
            After all the cross-collaboration with Engineering, CORE, Marketing
            &amp; Customer Support, while on the WWW project, I detected a lack
            of company-wide resources in development. I reached out to{" "}
            <a
              href="https://www.linkedin.com/in/gregsmith-thinkificceo/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Greg's LinkedIn profile"
            >
              Greg Smith (CEO/Co-Founder)
            </a>{" "}
            about creating a new role for myself. He agreed but ultimately
            wanted me for something bigger. That's when he told me about "The
            Flywheel".
          </RoleDescription>
          <RoleDescriptionHeading>Skill Focus</RoleDescriptionHeading>
          <SkillsFocusWrapper>
            <SkillsFocusList>
              <SkillsFocusListHeading>Languages</SkillsFocusListHeading>
              <SkillsFocusListItem>CSS/HTML</SkillsFocusListItem>
              <SkillsFocusListItem>VueJS</SkillsFocusListItem>
              <SkillsFocusListItem>WordPress/PHP</SkillsFocusListItem>
            </SkillsFocusList>
            <SkillsFocusList>
              <SkillsFocusListHeading>
                Apps &amp; Services
              </SkillsFocusListHeading>
              <SkillsFocusListItem>Photoshop</SkillsFocusListItem>
              <SkillsFocusListItem>Greenhouse</SkillsFocusListItem>
              <SkillsFocusListItem>Zendesk</SkillsFocusListItem>
            </SkillsFocusList>
          </SkillsFocusWrapper>
          <SectionDivider />
          <RoleDescriptionHeading>Year One</RoleDescriptionHeading>
          <RoleDescription>
            The initial expectations of my role was centric to helping build
            upon the existing website marketing feature, "Themes". The intent
            was to extend the existing liquid-based templating engine with more
            advanced &amp; dynamic customization options. Admittedly, I spent a
            great deal of time referencing shopify documentation. Working
            closely with{" "}
            <a
              href="https://www.linkedin.com/in/nickfostr/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Nick's LinkedIn profile"
            >
              Nick Foster (Creative Director)
            </a>
            , we aimed to provide the customer with a more modern user-friendly
            experience with what became Thinkific's first react-based product,
            Site Builder. Leadership was later transitioned to{" "}
            <a
              href="https://www.linkedin.com/in/michael-clay-3a90a310/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Mike's LinkedIn profile"
            >
              Mike Clay (Product Manager)
            </a>
            .
          </RoleDescription>
          <RoleDescription>
            Although the ground-work architecture of Themes &amp; Site Builder
            was laid and team growth was thriving, development slowed. I was
            resourced to our Marketing team to work on our{" "}
            <a
              href="https://www.thinkific.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Opens a new tab to Thinkific.com"
            >
              WWW
            </a>{" "}
            for some much needed updates on the Home &amp; Feature pages.
          </RoleDescription>
          <RoleDescriptionHeading>Skill Focus</RoleDescriptionHeading>
          <SkillsFocusWrapper>
            <SkillsFocusList>
              <SkillsFocusListHeading>Languages</SkillsFocusListHeading>
              <SkillsFocusListItem>CSS/HTML</SkillsFocusListItem>
              <SkillsFocusListItem>Ruby On Rails</SkillsFocusListItem>
              <SkillsFocusListItem>Ember</SkillsFocusListItem>
              <SkillsFocusListItem>jQuery</SkillsFocusListItem>
              <SkillsFocusListItem>CoffeeScript</SkillsFocusListItem>
            </SkillsFocusList>
            <SkillsFocusList>
              <SkillsFocusListHeading>Templating</SkillsFocusListHeading>
              <SkillsFocusListItem>Liquid</SkillsFocusListItem>
              <SkillsFocusListItem>HAML</SkillsFocusListItem>
              <SkillsFocusListItem>Jekyll</SkillsFocusListItem>
            </SkillsFocusList>
          </SkillsFocusWrapper>
        </RoleDetails>
      </Company>
      <SectionHeading>Letters of Recommendation</SectionHeading>
      <a
        href="https://jontsang.ca/letter-of-recommendation-tia-fomenoff.pdf"
        target="_blank"
        rel="noreferrer"
      >
        Tia Fomenoff - Senior Director, People
      </a>
      <TogglePreviousWork
        handleClick={() => setShowPreviousWork(!showPreviousWork)}
      >
        Show more work experience
      </TogglePreviousWork>
      <PreviousWorkExperience isVisible={showPreviousWork}>
        <SectionHeading>Previous Experience</SectionHeading>
        <Company>
          <CompanyName>Kellett Communications</CompanyName>
          <CompanyDetails>
            Marketing Agency · Yellowknife, NWT · 6 months
          </CompanyDetails>
          <Role>Full Stack Developer</Role>
          <RoleTimeframe dateTime="2016-10-01/2017-03-31">
            October 2016 &ndash; March 2017
          </RoleTimeframe>
          <RoleDescription>
            Responsible for determining and planning architecture, layout,
            scoping projects, estimating hours, reviewing all materials,
            including checking estimates and specifications. Other duties
            include technical leadership and accountability with clients.
            Overseeing freelance &amp; partner web developers. Code reviews,
            beta testing and final product delivery. Support and communication
            with directors towards technical solutions to maintain creative
            process and vision. Maintenance contracts or engagements. Working
            with account managers to successfully manage client relationships.
          </RoleDescription>
        </Company>
        <Company>
          <CompanyName>Outcrop Communications Ltd.</CompanyName>
          <CompanyDetails>
            Marketing Agency · Yellowknife, NWT · 1 year 4 months
          </CompanyDetails>
          <Role>Web Developer</Role>
          <RoleTimeframe dateTime="2015-06-01/2011-09-30">
            June 2015 &ndash; Sept 2016
          </RoleTimeframe>
          <RoleDescription>
            Originally signed to task for front-end development of theming and
            functionality; expanding needs lead to cover any and all areas that
            required immediate action or to close up the divide.
            Responsibilities ranged from troubleshooting both local and remote
            server environments to hotfix compatibility issues. Auditing
            existing deployments for security &amp; maintenance. Headed a number
            of projects, working closely with our design team members. Handled
            the design process for an expansion to one of the larger clients
            site portfolio (WSCC). Other duties include detailing technical
            documentation, site planning/wireframing, best-practice &amp;
            process standards innovation and new-hires support.
          </RoleDescription>
        </Company>
      </PreviousWorkExperience>
    </AppContainer>
  );
};

export default Resume;
