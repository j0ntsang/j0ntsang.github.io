import styled from "styled-components";

const SkillsFocusWrapper = styled.section`
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    flex-wrap: nowrap;
  }
`;

const SkillsFocusList = styled.ul`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;

  @media (min-width: 768px) {
    padding-left: 24px;
  }
`;

const SkillsFocusListHeading = styled.li`
  font-size: 19px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const SkillsFocusListItem = styled.li`
  
`;

export {
  SkillsFocusWrapper,
  SkillsFocusList,
  SkillsFocusListHeading,
  SkillsFocusListItem,
};
