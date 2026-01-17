import styled from "@emotion/styled";
import React from "react";
import { Typography } from "./Typography";

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  rtl: boolean;
}

const THEME = "#d23f0b";

const StyledSidebarHeader = styled.div`
  height: 64px;
  min-height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;

  > div {
    width: 100%;
    overflow: hidden;
  }
`;

const LogoWrap = styled.div<{ rtl?: boolean }>`
  width: 42px;
  min-width: 42px;
  height: 42px;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ rtl }) =>
    rtl
      ? `
      margin-left: 10px;
      margin-right: 4px;
    `
      : `
      margin-right: 10px;
      margin-left: 4px;
    `}
`;

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ rtl, ...rest }) => {
  return (
    <StyledSidebarHeader {...rest}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <LogoWrap rtl={rtl}>
          <img
            src="/SHADOW.png"
            alt="ExerSearch logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </LogoWrap>

        <Typography
          variant="subtitle1"
          fontWeight={800}
          style={{
            color: THEME,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          ExerSearch
        </Typography>
      </div>
    </StyledSidebarHeader>
  );
};
