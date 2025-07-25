import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Range, Root, Thumb, Track } from "@radix-ui/react-slider";
import Color from "color";
import { PipetteIcon } from "lucide-react";
import { type ComponentProps, type HTMLAttributes, useCallback, useEffect, useRef, useState } from "react";
import { createContext, useContext } from "react";

interface ColorPickerContextValue {
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  mode: string;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setAlpha: (alpha: number) => void;
  setMode: (mode: string) => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(undefined);

export const useColorPicker = () => {
  const context = useContext(ColorPickerContext);

  if (!context) {
    throw new Error("useColorPicker must be used within a ColorPickerProvider");
  }

  return context;
};

export type ColorPickerProps = HTMLAttributes<HTMLDivElement> & {
  value?: Parameters<typeof Color>[0];
  defaultValue?: Parameters<typeof Color>[0];
  onChange?: (value: Parameters<typeof Color.rgb>[0]) => void;
};

export const ColorPicker = ({
  value,
  defaultValue = "rgba(0, 0, 0, 1)",
  onChange,
  className,
  children,
  ...props
}: ColorPickerProps & { children?: React.ReactNode }) => {
  const selectedColor = Color(value);
  const defaultColor = Color(defaultValue);

  const [hue, setHue] = useState(selectedColor.hue() || defaultColor.hue() || 0);
  const [saturation, setSaturation] = useState(selectedColor.saturationl() || defaultColor.saturationl() || 100);
  const [lightness, setLightness] = useState(selectedColor.lightness() || defaultColor.lightness() || 50);
  const [alpha, setAlpha] = useState(selectedColor.alpha() * 100 || defaultColor.alpha() * 100);
  const [mode, setMode] = useState("hex");

  // Update color when controlled value changes
  useEffect(() => {
    if (value) {
      const incomingColor = Color(value); // Use generic Color() constructor

      // Ensure values are numbers and not NaN, provide defaults if necessary
      const newHue = incomingColor.hue();
      const newSaturation = incomingColor.saturationl(); // For HSL model
      const newLightness = incomingColor.lightness();
      const newAlpha = incomingColor.alpha();

      setHue(isNaN(newHue) ? 0 : newHue);
      setSaturation(isNaN(newSaturation) ? 100 : newSaturation);
      setLightness(isNaN(newLightness) ? 50 : newLightness);
      setAlpha(isNaN(newAlpha) ? 100 : newAlpha * 100); // Context alpha is 0-100
    }
  }, [value]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
      onChange(color.rgb().array());
    }
  }, [hue, saturation, lightness, alpha, onChange]);

  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        lightness,
        alpha,
        mode,
        setHue,
        setSaturation,
        setLightness,
        setAlpha,
        setMode,
      }}
    >
      <div className={cn("flex size-full flex-col gap-4", className)} {...props}>
        {children}
      </div>
    </ColorPickerContext.Provider>
  );
};

export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerSelection = ({ className, ...props }: ColorPickerSelectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { hue, setSaturation, setLightness } = useColorPicker();

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!isDragging || !containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      setPosition({ x, y });
      setSaturation(x * 100);
      const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x);
      const lightness = topLightness * (1 - y);

      setLightness(lightness);
    },
    [isDragging, setSaturation, setLightness],
  );

  useEffect(() => {
    const handlePointerUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, handlePointerMove]);

  return (
    <div
      ref={containerRef}
      className={cn("relative size-full cursor-crosshair rounded", className)}
      style={{
        background: `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0)),
                     linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0)),
                     hsl(${hue}, 100%, 50%)`,
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        setIsDragging(true);
        handlePointerMove(e.nativeEvent);
      }}
      {...props}
    >
      <div
        className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white"
        style={{
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
};

export type ColorPickerHueProps = ComponentProps<typeof Root>;

export const ColorPickerHue = ({
  className,
  orientation = "horizontal",
  ...props
}: ColorPickerHueProps & { orientation?: "horizontal" | "vertical" }) => {
  const { hue, setHue } = useColorPicker();

  return (
    <Root
      value={[hue]}
      max={360}
      step={1}
      orientation={orientation}
      className={cn(
        "relative flex touch-none",
        orientation === "horizontal" ? "h-4 w-full" : "h-full w-4 flex-col",
        className,
      )}
      onValueChange={([hue]) => setHue(hue)}
      {...props}
    >
      <Track
        className={cn(
          "relative grow rounded-full",
          orientation === "horizontal" ? "my-0.5 h-2 w-full" : "mx-0.5 w-2 h-full",
          "bg-[linear-gradient(to_right_top,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)]",
        )}
        style={
          orientation === "vertical"
            ? {
                background: "linear-gradient(to bottom, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)",
              }
            : {
                background: "linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)",
              }
        }
      >
        <Range className="absolute h-full rounded-full" />
      </Track>
      <Thumb
        className={cn(
          "block h-4 w-4 rounded-full border border-primary/50 shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          orientation === "vertical" && "h-4 w-4", // Adjust thumb for vertical
        )}
      />
    </Root>
  );
};

export type ColorPickerAlphaProps = ComponentProps<typeof Root>;

export const ColorPickerAlpha = ({
  className,
  orientation = "horizontal",
  ...props
}: ColorPickerAlphaProps & { orientation?: "horizontal" | "vertical" }) => {
  const { alpha, setAlpha } = useColorPicker();
  const { hue, saturation, lightness } = useColorPicker();
  const color = Color.hsl(hue, saturation, lightness);
  const solidColor = color.rgb().string();

  return (
    <Root
      value={[alpha]}
      max={100}
      step={1}
      orientation={orientation}
      className={cn(
        "relative flex touch-none",
        orientation === "horizontal" ? "h-4 w-full" : "h-full w-4 flex-col",
        className,
      )}
      onValueChange={([alpha]) => setAlpha(alpha)}
      {...props}
    >
      <Track
        className={cn(
          "relative grow rounded-full",
          orientation === "horizontal" ? "my-0.5 h-2 w-full" : "mx-0.5 w-2 h-full",
        )}
        style={{
          background:
            'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==") center',
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              orientation === "horizontal"
                ? `linear-gradient(to right, transparent, ${solidColor})`
                : `linear-gradient(to top, transparent, ${solidColor})`,
          }}
        />
        <Range className="absolute h-full rounded-full bg-transparent" />
      </Track>
      <Thumb
        className={cn(
          "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          orientation === "vertical" && "h-4 w-4", // Adjust thumb for vertical
        )}
      />
    </Root>
  );
};

export type ColorPickerEyeDropperProps = ComponentProps<typeof Button>;

export const ColorPickerEyeDropper = ({ className, ...props }: ColorPickerEyeDropperProps) => {
  const { setHue, setSaturation, setLightness, setAlpha } = useColorPicker();

  const handleEyeDropper = async () => {
    try {
      // @ts-ignore - EyeDropper API is experimental
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const color = Color(result.sRGBHex);
      const [h, s, l] = color.hsl().array();

      setHue(h);
      setSaturation(s);
      setLightness(l);
      setAlpha(100);
    } catch (error) {
      console.error("EyeDropper failed:", error);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleEyeDropper}
      className={cn("shrink-0 text-muted-foreground", className)}
      {...props}
    >
      <PipetteIcon size={16} />
    </Button>
  );
};

export type ColorPickerOutputProps = ComponentProps<typeof SelectTrigger>;

const formats = ["hex", "rgb", "css", "hsl"];

export const ColorPickerOutput = ({ className, ...props }: ColorPickerOutputProps) => {
  const { mode, setMode } = useColorPicker();

  return (
    <Select value={mode} onValueChange={setMode}>
      <SelectTrigger className="h-8 w-20 shrink-0 text-xs" {...props}>
        <SelectValue placeholder="Mode" />
      </SelectTrigger>
      <SelectContent>
        {formats.map((format) => (
          <SelectItem key={format} value={format} className="text-xs">
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

type PercentageInputProps = ComponentProps<typeof Input>;

const PercentageInput = ({ className, ...props }: PercentageInputProps) => {
  return (
    <div className="relative">
      <Input
        type="text"
        {...props}
        className={cn("h-8 w-[3.25rem] rounded-l-none bg-secondary px-2 text-xs shadow-none", className)}
      />
      <span className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground text-xs">%</span>
    </div>
  );
};

export type ColorPickerFormatProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerFormat = ({ className, ...props }: ColorPickerFormatProps) => {
  const { hue, saturation, lightness, alpha, mode } = useColorPicker();
  const color = Color.hsl(hue, saturation, lightness, alpha / 100);

  if (mode === "hex") {
    const hex = color.hex();

    return (
      <div className={cn("-space-x-px relative flex w-full items-center rounded-md shadow-sm", className)} {...props}>
        <Input type="text" value={hex} className="h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none" />
        <PercentageInput value={alpha} />
      </div>
    );
  }

  if (mode === "rgb") {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value));

    return (
      <div className={cn("-space-x-px flex items-center rounded-md shadow-sm", className)} {...props}>
        {rgb.map((value, index) => (
          <Input
            key={index}
            type="text"
            value={value}
            readOnly
            className={cn(
              "h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none",
              index !== 0 && "rounded-l-none", // ensure first input has left radius
              className,
            )}
          />
        ))}
        <PercentageInput value={alpha} />
      </div>
    );
  }

  if (mode === "css") {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value));

    return (
      <div className={cn("w-full rounded-md shadow-sm", className)} {...props}>
        <Input
          type="text"
          className="h-8 w-full bg-secondary px-2 text-xs shadow-none"
          value={`rgba(${rgb.join(", ")}, ${alpha}%)`}
          readOnly
          {...props}
        />
      </div>
    );
  }

  if (mode === "hsl") {
    const hsl = color
      .hsl()
      .array()
      .map((value) => Math.round(value));

    return (
      <div className={cn("-space-x-px flex items-center rounded-md shadow-sm", className)} {...props}>
        {hsl.map((value, index) => (
          <Input
            key={index}
            type="text"
            value={value}
            readOnly
            className={cn(
              "h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none",
              index !== 0 && "rounded-l-none", // ensure first input has left radius
              className,
            )}
          />
        ))}
        <PercentageInput value={alpha} />
      </div>
    );
  }

  return null;
};
