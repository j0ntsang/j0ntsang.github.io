import styled from 'styled-components';

const Divider = styled.span`
  display: inline-block;
  position: relative;
  padding: 0 16px;

  &:before {
    position: absolute;
    top: 0;
    left: 50%;
    display: block;
    width: 1px;
    height: 100%;
    transform: translateX(-50%);
    background: #ffffff;
    content: "";
    opacity: .2;
  }
`;

export default Divider;
