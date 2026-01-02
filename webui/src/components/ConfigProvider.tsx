import React, { useContext, useEffect, useState } from "react";
import { Config, Repo } from "../../gen/ts/v1/config_pb";
import { setDateTimeDisplaySettings } from "../lib/formatting";

type ConfigCtx = [Config | null, (config: Config) => void];

const ConfigContext = React.createContext<ConfigCtx>([null, () => {}]);

export const ConfigContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [config, setConfigInternal] = useState<Config | null>(null);
  
  const setConfig = (newConfig: Config) => {
    setConfigInternal(newConfig);
    // Update date/time formatting settings globally when config changes
    setDateTimeDisplaySettings(newConfig.displaySettings);
  };
  
  return (
    <>
      <ConfigContext.Provider value={[config, setConfig]}>
        {children}
      </ConfigContext.Provider>
    </>
  );
};

export const useConfig = (): ConfigCtx => {
  const context = useContext(ConfigContext);
  return context;
};
