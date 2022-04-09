import styled from 'styled-components';

const YourName = styled.h1`
  display: flex;
  flex-direction: column;
  margin: 0 0 24px;
  font-size: 2.75rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: baseline;
  }
`;

export default YourName;
