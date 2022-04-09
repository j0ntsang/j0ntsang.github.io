import styled from "styled-components";

interface Props {
  children: any;
  handleClick(): any;
}

const StyledButton = styled.button`
  display: block;
  margin: 32px auto 40px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #000000;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  appearance: none;
`;

const TogglePreviousWork = ({ children, handleClick }: Props) => (
  <StyledButton onClick={handleClick}>
    {children}
  </StyledButton>
);

export default TogglePreviousWork;
