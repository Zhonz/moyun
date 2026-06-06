/**
 * 性能监控工具
 * 监控 LCP (最大内容绘制), FID (首次输入延迟), CLS (累积布局偏移)
 */

class PerformanceMetrics {
    constructor() {
        this.metrics = {
            LCP: null,
            FID: null,
            CLS: 0,
            TTFB: null,
            FCP: null,
            loadTime: null
        };
        this.listeners = [];
        this.init();
    }

    init() {
        if (typeof window === 'undefined') return;

        // 监控页面加载时间
        this.observeLoadTime();

        // 监控 LCP
        this.observeLCP();

        // 监控 FID
        this.observeFID();

        // 监控 CLS
        this.observeCLS();

        // 监控 TTFB
        this.observeTTFB();
    }

    /**
     * 页面加载时间
     */
    observeLoadTime() {
        if (document.readyState === 'complete') {
            this.metrics.loadTime = performance.now();
        } else {
            window.addEventListener('load', () => {
                this.metrics.loadTime = performance.now();
                this.notifyListeners();
            });
        }
    }

    /**
     * LCP 监控
     */
    observeLCP() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];

                this.metrics.LCP = {
                    value: lastEntry.renderTime || lastEntry.loadTime,
                    element: lastEntry.element ? lastEntry.element.tagName : null
                };
                this.notifyListeners();
            });

            observer.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
            console.log('LCP 监控不支持');
        }
    }

    /**
     * FID 监控
     */
    observeFID() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry.processingStart > entry.startTime) {
                        this.metrics.FID = {
                            value: entry.processingStart - entry.startTime,
                            eventType: entry.name
                        };
                        this.notifyListeners();
                    }
                });
            });

            observer.observe({ type: 'first-input', buffered: true });
        } catch (e) {
            console.log('FID 监控不支持');
        }
    }

    /**
     * CLS 监控
     */
    observeCLS() {
        if (!('PerformanceObserver' in window)) return;

        let clsValue = 0;
        let sessionTimeout = null;
        let lastEntry = null;

        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();

                for (const entry of entries) {
                    // 忽略用户输入期间的布局偏移
                    if (!entry.hadRecentInput) {
                        const layoutShift = entry;

                        // 检查是否与上一个条目在同一个会话中（1秒内）
                        if (sessionTimeout && entry.startTime - lastEntry.startTime < 1000) {
                            clsValue += layoutShift.value;
                        } else {
                            clsValue = layoutShift.value;
                        }

                        lastEntry = entry;

                        // 重置会话超时
                        if (sessionTimeout) clearTimeout(sessionTimeout);
                        sessionTimeout = setTimeout(() => {
                            sessionTimeout = null;
                        }, 1000);

                        this.metrics.CLS = clsValue;
                        this.notifyListeners();
                    }
                }
            });

            observer.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
            console.log('CLS 监控不支持');
        }
    }

    /**
     * TTFB 监控
     */
    observeTTFB() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                if (entries.length > 0) {
                    const entry = entries[0];
                    this.metrics.TTFB = entry.responseStart - entry.requestStart;
                    this.notifyListeners();
                }
            });

            observer.observe({ type: 'navigation', buffered: true });
        } catch (e) {
            // 降级方案：使用 timing API
            const timing = performance.timing;
            if (timing) {
                this.metrics.TTFB = timing.responseStart - timing.requestStart;
            }
        }
    }

    /**
     * 添加监听器
     */
    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    /**
     * 移除监听器
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    /**
     * 通知监听器
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getMetrics());
            } catch (e) {
                console.error('性能指标监听器错误:', e);
            }
        });
    }

    /**
     * 获取所有指标
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * 获取可读的指标报告
     */
    getReadableReport() {
        const m = this.metrics;
        const report = [];

        report.push('=== 性能指标报告 ===');
        report.push(`页面加载时间: ${m.loadTime ? (m.loadTime / 1000).toFixed(2) + 's' : 'N/A'}`);
        report.push(`LCP (最大内容绘制): ${m.LCP ? m.LCP.value.toFixed(2) + 'ms' : 'N/A'}`);
        report.push(`FID (首次输入延迟): ${m.FID ? m.FID.value.toFixed(2) + 'ms' : 'N/A'}`);
        report.push(`CLS (累积布局偏移): ${m.CLS ? m.CLS.toFixed(4) : 'N/A'}`);
        report.push(`TTFB (首字节时间): ${m.TTFB ? m.TTFB.toFixed(2) + 'ms' : 'N/A'}`);

        return report.join('\n');
    }

    /**
     * 检查性能是否达标
     */
    checkPerformanceTargets() {
        const targets = {
            LCP: 2500,    // < 2.5s 为良好
            FID: 100,     // < 100ms 为良好
            CLS: 0.1,     // < 0.1 为良好
            TTFB: 800     // < 800ms 为良好
        };

        const results = {
            LCP: this.metrics.LCP ? this.metrics.LCP.value <= targets.LCP : null,
            FID: this.metrics.FID ? this.metrics.FID.value <= targets.FID : null,
            CLS: this.metrics.CLS !== null ? this.metrics.CLS <= targets.CLS : null,
            TTFB: this.metrics.TTFB ? this.metrics.TTFB <= targets.TTFB : null
        };

        return {
            targets,
            actual: this.metrics,
            passed: results,
            allPassed: Object.values(results).every(r => r === true)
        };
    }
}

// 导出单例
const performanceMetrics = new PerformanceMetrics();

export { performanceMetrics, PerformanceMetrics };
export default performanceMetrics;