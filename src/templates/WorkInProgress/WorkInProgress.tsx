import AppContainer from "templates/AppContainer";
import CodepenSVG from "templates/Resume/svg/CodepenSVG";
import GithubSVG from "templates/Resume/svg/GithubSVG";
import H1 from "atoms/H1";
import LinkedInSVG from "templates/Resume/svg/LinkedInSVG";
import MissionStatement from "templates/Resume/atoms/MissionStatement";
import PreviousRole from "templates/Resume/atoms/PreviousRole";
import ResumeHeader from "templates/Resume/atoms/ResumeHeader";
import SocialLink from "templates/Resume/atoms/SocialLink";
import Tagline from "templates/Resume/atoms/Tagline";
import styled from "styled-components";

const ResumeContainer = styled(AppContainer)`
  @media (min-width: 768px) {
    max-width: 768px;
  }
`;

const WorkInProgress: React.VFC = () => {
  return (
    <ResumeContainer>
      <ResumeHeader>
        <H1>Jonathan Tsang</H1>
        <Tagline>A11y Advocate & CSS Connoisseur</Tagline>
        <SocialLink
          href="https://codepen.io/tsang"
          aria-label="Opens Jonathan's CodePen profile in a new tab"
          rel="noreferrer"
          target="_blank">
          <CodepenSVG />
        </SocialLink>
        <SocialLink
          href="https://www.github.com/j0ntsang"
          aria-label="Opens Jonathan's GitHub profile in a new tab"
          rel="noreferrer"
          target="_blank">
          <GithubSVG />
        </SocialLink>
        <SocialLink
          href="https://www.linkedin.com/in/j0ntsang"
          aria-label="Opens Jonathan's LinkedIn profile in a new tab"
          rel="noreferrer"
          target="_blank">
          <LinkedInSVG />
        </SocialLink>
        <PreviousRole>
          Former Senior Design System Engineer at Thinkific
        </PreviousRole>
        <MissionStatement>
          Looking forward to the next opportunity that allows me to continue
          helping make the web more accessible &amp; usable for everyone.{" "}
        </MissionStatement>
      </ResumeHeader>
      <p>
        For current updates please refer to{" "}
        <a
          aria-label="Click here to open Jonathan Tsang's 2025 resume in a new window"
          href="https://jontsang.ca/resume.pdf"
          rel="noreferrer"
          target="_blank">
          my updated resume for 2025
        </a>
        .
      </p>
    </ResumeContainer>
  );
};

export default WorkInProgress;
