import { useCookies, ReactCookieProps } from "react-cookie";
import { CookieSetOptions } from "universal-cookie";
import { TbReload } from "react-icons/tb";

interface ReloadProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  cacheSession?: string;
  cacheOptions?: CookieSetOptions;
}
export function ReloadButton({
  cacheSession,
  cacheOptions,
  onClick,
  onContextMenu,
  ...args
}: ReloadProps) {
  const deleteCookie = useCookies()[2];
  return (
    <button
      type="button"
      title="読み込み"
      onClick={
        onClick
          ? onClick
          : () => {
              location.reload();
            }
      }
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e);
        else {
          if (cacheSession) deleteCookie(cacheSession, cacheOptions);
          location.reload();
        }
      }}
      {...args}
    >
      <TbReload />
    </button>
  );
}
