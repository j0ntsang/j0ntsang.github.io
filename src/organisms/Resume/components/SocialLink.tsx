import styled from 'styled-components';

const SocialLink = styled.a`
  display: inline-block;
  margin-right: 16px;
  height: 2rem;

  &:last-of-type {
    margin-right: 0;
  }

  & svg {
    width: 100%;
    height: 100%;
  }
`;

export default SocialLink;
