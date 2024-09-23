export function VerifyEmailEmail(
{
    code
}: { code: string; }
) {
  return `
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <div
    style="
      display: none;
      overflow: hidden;
      line-height: 1px;
      opacity: 0;
      max-height: 0;
      max-width: 0;
    "
  >
    Verify your Email
    <div>
       ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌
    </div>
  </div>
  <body
    style="
      background-color: rgb(255, 255, 255);
      margin-top: auto;
      margin-bottom: auto;
      margin-left: auto;
      margin-right: auto;
      font-family:
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        &quot;Segoe UI&quot;,
        Roboto,
        &quot;Helvetica Neue&quot;,
        Arial,
        &quot;Noto Sans&quot;,
        sans-serif,
        &quot;Apple Color Emoji&quot;,
        &quot;Segoe UI Emoji&quot;,
        &quot;Segoe UI Symbol&quot;,
        &quot;Noto Color Emoji&quot;;
    "
  >
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        max-width: 37.5em;
        border-width: 1px;
        border-style: solid;
        border-color: rgb(234, 234, 234);
        border-radius: 0.25rem;
        margin-top: 40px;
        margin-bottom: 40px;
        margin-left: auto;
        margin-right: auto;
        padding: 20px;
        width: 465px;
      "
    >
      <tbody>
        <tr style="width: 100%">
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="text-align: center; margin-top: 32px; margin-bottom: 32px"
            >
              <tbody>
                <tr>
                  <td>
                    <p
                      style="
                        font-size: 14px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: rgb(0, 0, 0);
                        font-weight: 500;
                        margin-bottom: 2rem;
                      "
                    >
                      Verification code:
                      <!-- -->${code}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr
              style="
                width: 100%;
                border: none;
                border-top: 1px solid #eaeaea;
                border-width: 1px;
                border-style: solid;
                border-color: rgb(234, 234, 234);
                margin-top: 26px;
                margin-bottom: 26px;
                margin-left: 0px;
                margin-right: 0px;
              "
            />
            <p
              style="
                font-size: 12px;
                line-height: 24px;
                margin: 16px 0;
                color: rgb(102, 102, 102);
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              © 2024 . All rights reserved.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;
}
