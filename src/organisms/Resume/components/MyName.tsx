import styled from 'styled-components';

const MyName = styled.h1`
  display: flex;
  flex-direction: column;
  margin: 0;
  font-size: 2.75rem;
  line-height: normal;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: baseline;
  }
`;

export default MyName;
