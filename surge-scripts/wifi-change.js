let config = {
    silence: false, // 是否静默运行，默认false
    cellular: "RULE", // 蜂窝数据下的模式，RULE代表规则模式，PROXY代表全局代理，DIRECT代表全局直连
    wifi: "RULE", // wifi下默认的模式
    all_direct: ["TP-LINK_5G_BD3A"], // 指定全局直连的wifi名字
    all_proxy: [], // 指定全局代理的wifi名字
};

const MODE_NAMES = {
    RULE: "🚦规则模式",
    PROXY: "🚀全局代理模式",
    DIRECT: "🎯全局直连模式",
};

manager();
$done();

function manager() {
    let ssid;
    let mode;

    const v4_ip = $network.v4.primaryAddress;
    // no network connection
    if (!config.silence && !v4_ip) {
        notify("🤖 Surge 运行模式", "❌ 当前无网络", "");
        return;
    }
    ssid = $network.wifi.ssid;
    mode = ssid ? lookupSSID(ssid) : config.cellular;
    const target = {
        RULE: "rule",
        PROXY: "global-proxy",
        DIRECT: "direct",
    }[mode];

    const OUTBOUND_RULE_KEY = "surge_outbound_rule";
    // 如果当前网络的 outbound rule 与目标不一致，则切换
    const outboundRule = $persistentStore.read(OUTBOUND_RULE_KEY);
    if (!outboundRule || outboundRule !== target) {
        $persistentStore.write(target, OUTBOUND_RULE_KEY);

        $surge.setOutboundMode(target);

        if (!config.silence) {
            notify(
                "🤖 Surge 运行模式",
                `当前网络：${ssid ? ssid : "蜂窝数据"}`,
                `Surge 已切换至${MODE_NAMES[mode]}`
            );
        }
    }
}

function lookupSSID(ssid) {
    const map = {};
    config.all_direct.map((id) => (map[id] = "DIRECT"));
    config.all_proxy.map((id) => (map[id] = "PROXY"));

    const matched = map[ssid];
    return matched ? matched : config.wifi;
}

function notify(title, subtitle, content) {
    const SUBTITLE_STORE_KEY = "running_mode_notified_subtitle";
    const lastNotifiedSubtitle = $persistentStore.read(SUBTITLE_STORE_KEY);

    if (!lastNotifiedSubtitle || lastNotifiedSubtitle !== subtitle) {
        $persistentStore.write(subtitle.toString(), SUBTITLE_STORE_KEY);
        $notification.post(title, subtitle, content);
    }
}