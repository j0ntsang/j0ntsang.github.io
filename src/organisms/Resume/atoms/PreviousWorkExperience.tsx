import styled from "styled-components";

interface Props {
  isVisible: boolean;
}

const PreviousWorkExperience = styled.section<Props>`
  ${(props) =>
    !props.isVisible &&
    `
    height: 0;
    visibility: hidden;
    overflow: hidden;
  `}
`;

export default PreviousWorkExperience;
