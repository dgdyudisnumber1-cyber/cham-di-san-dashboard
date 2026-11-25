// Cham Di San | Digital Performance Dashboard Application Logic
// Replicating 5 Tabs, 34 Cards from Metabase Dashboard ID 4

let rawData = null;
let currentFilter = 'all';
const charts = {};

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initFilterListener();
  await loadData();
});

// Tab Navigation
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        // Trigger chart resize on tab switch
        requestAnimationFrame(() => {
          targetContent.querySelectorAll('canvas').forEach(canvas => charts[canvas.id]?.resize());
        });
      }
    });
  });
}

// Global Filter
function initFilterListener() {
  const select = document.getElementById('global-date-filter');
  if (select) {
    select.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      updateFilteredViews();
    });
  }

  document.getElementById('traffic-data-mode').addEventListener('change', () => {
    if (rawData) renderTrafficSources(getFilteredWebsiteDaily());
  });

  const printBtn = document.getElementById('btn-print-snapshot');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// Load JSON data
async function loadData() {
  try {
    rawData = window.CHAM_DI_SAN_DATA;
    if (location.protocol !== 'file:') {
      const res = await fetch('data/dashboard_data.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Không thể tải dữ liệu Dashboard');
      rawData = await res.json();
    }
    if (!rawData) throw new Error('Thiếu tệp dữ liệu Dashboard');
  } catch (err) {
    if (window.CHAM_DI_SAN_DATA) {
      console.log('Using fallback window.CHAM_DI_SAN_DATA');
      rawData = window.CHAM_DI_SAN_DATA;
    } else {
      console.error('Lỗi tải dữ liệu dashboard:', err);
      document.querySelector('.main-wrapper').innerHTML = `
        <div style="background:#fee2e2; border:1px solid #ef4444; color:#991b1b; padding:1.5rem; border-radius:12px; margin-top:2rem;">
          <h3><i class="fa-solid fa-triangle-exclamation"></i> Không thể tải dữ liệu dashboard_data.json</h3>
          <p style="margin-top:0.5rem;">Vui lòng kiểm tra file dữ liệu tại thư mục <code>data/dashboard_data.json</code> hoặc chạy script đồng bộ.</p>
        </div>
      `;
      return;
    }
  }

  renderMetadata();
  renderAllDashboard();
}

function renderMetadata() {
  if (!rawData || !rawData.metadata) return;
  const m = rawData.metadata;

  const lastSyncEl = document.getElementById('meta-last-sync');
  const latestDateEl = document.getElementById('meta-latest-date');
  const warningBanner = document.getElementById('sync-warning-banner');

  if (lastSyncEl) lastSyncEl.innerText = m.last_updated_at || 'Chưa có';
  if (latestDateEl) latestDateEl.innerText = m.latest_ga4_date || 'Chưa có';
  document.getElementById('meta-report-mode').textContent =
    document.body.dataset.snapshot === 'true' ? 'BẢN CHỤP NỘP BÀI' : 'BÁO CÁO TRỰC TUYẾN';

  if (warningBanner) {
    if (m.sync_warning) {
      warningBanner.style.display = 'block';
      warningBanner.textContent = `Cảnh báo đồng bộ: ${m.sync_warning}`;
    } else {
      warningBanner.style.display = 'none';
      warningBanner.innerHTML = '';
    }
  }
}

// Filter dataset by selected date option
function getFilteredWebsiteDaily() {
  if (!rawData || !rawData.website_daily) return [];
  const list = rawData.website_daily;
  if (currentFilter === 'all') return list;
  if (currentFilter === 'history') return list.filter(d => d.date <= '2026-11-17');
  if (currentFilter === 'live') return list.filter(d => d.date >= '2026-11-18');
  if (currentFilter === 'scenario') {
    const [start, end] = (window.CHAM_DI_SAN_TRAFFIC_SCENARIO?.period || '').split('/');
    return list.filter(row => row.date >= start && row.date <= end);
  }

  if (['7d', '14d', '30d'].includes(currentFilter) && list.length) {
    const start = new Date(list.at(-1).date);
    start.setUTCDate(start.getUTCDate() - (parseInt(currentFilter, 10) - 1));
    return list.filter(row => row.date >= start.toISOString().slice(0, 10));
  }

  return list;
}

function renderAllDashboard() {
  renderTab1();
  renderTab2();
  renderTab3();
  renderTab4();
  renderTab5();
}

function updateFilteredViews() {
  renderTab1KPIs();
  renderTab1Charts();
  renderTab2KPIs();
  renderTab2Charts();
}

// ==========================================
// TAB 1: TỔNG QUAN (8 CARDS)
// ==========================================
function renderTab1() {
  renderTab1KPIs();
  renderTab1Charts();
}

function renderTab1KPIs() {
  const daily = getFilteredWebsiteDaily();
  const totalSessions = daily.reduce((acc, r) => acc + (r.sessions || 0), 0);
  const totalViews = daily.reduce((acc, r) => acc + (r.page_views || 0), 0);

  // TikTok views (3,825)
  const tiktokViews = rawData.tiktok_content.reduce((acc, r) => acc + (r.views || 0), 0);

  // Total social interactions (183 = 42 FB + 141 TikTok)
  const fbInteractions = rawData.facebook_posts.reduce((acc, r) => acc + (r.interactions || 0), 0);
  const ttInteractions = rawData.tiktok_content.reduce((acc, r) => acc + (r.interactions_reported || 0), 0);
  const totalInteractions = fbInteractions + ttInteractions;

  // Q84
  const elQ84 = document.getElementById('kpi-q84');
  if (elQ84) elQ84.innerText = totalSessions.toLocaleString('vi-VN');

  // Q85
  const elQ85 = document.getElementById('kpi-q85');
  if (elQ85) elQ85.innerText = totalViews.toLocaleString('vi-VN');

  // Q86
  const elQ86 = document.getElementById('kpi-q86');
  if (elQ86) elQ86.innerText = tiktokViews.toLocaleString('vi-VN');
  const videoViews = rawData.tiktok_content.filter(row => row.post_type === 'Video')
    .reduce((sum, row) => sum + (row.views || 0), 0);
  document.getElementById('tiktok-view-breakdown').textContent =
    `Video: ${videoViews.toLocaleString('vi-VN')} · Bài ảnh: ${(tiktokViews - videoViews).toLocaleString('vi-VN')}`;

  // Q87
  const elQ87 = document.getElementById('kpi-q87');
  if (elQ87) elQ87.innerText = totalInteractions.toLocaleString('vi-VN');
  document.getElementById('social-interaction-breakdown').textContent =
    `Facebook: ${fbInteractions.toLocaleString('vi-VN')} · TikTok: ${ttInteractions.toLocaleString('vi-VN')}`;
}

function estimateTrendDatasets(daily, metrics) {
  const estimates = new Map((window.CHAM_DI_SAN_TRAFFIC_SCENARIO?.daily_rows || [])
    .map(row => [row.date, row]));
  if (!daily.some(row => estimates.has(row.date))) return [];
  const names = {
    page_views: 'Lượt xem trang',
    sessions: 'Phiên',
    active_users: 'Người dùng hoạt động'
  };
  const colors = { page_views: '#2563eb', sessions: '#0284c7', active_users: '#047857' };
  return metrics.map(metric => ({
    label: names[metric] + ' · ước tính',
    data: daily.map(row => estimates.get(row.date)?.[metric] ?? null),
    borderColor: colors[metric],
    backgroundColor: 'transparent',
    borderDash: [7, 4],
    borderWidth: 3,
    pointRadius: 4,
    pointStyle: 'rectRot',
    pointBackgroundColor: colors[metric],
    spanGaps: false,
    tension: 0
  }));
}

function renderTab1Charts() {
  const daily = getFilteredWebsiteDaily();

  // Q88: Xu hướng hoạt động Website (Area chart)
  renderChart('chart-q88', {
    type: 'line',
    data: {
      labels: daily.map(d => formatDate(d.date)),
      datasets: [
        {
          label: 'Lượt xem trang · GA4',
          data: daily.map(d => d.page_views),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2
        },
        {
          label: 'Phiên · GA4',
          data: daily.map(d => d.sessions),
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2
        },
        {
          label: 'Người dùng hoạt động · GA4',
          data: daily.map(d => d.active_users),
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 2
        },
        ...estimateTrendDatasets(daily, ['page_views', 'sessions', 'active_users'])
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Q89: Phân loại lượt xem theo từng nền tảng (Donut)
  const totalWebViews = daily.reduce((acc, r) => acc + (r.page_views || 0), 0);
  const totalTtViews = rawData.tiktok_content.reduce((acc, r) => acc + (r.views || 0), 0);
  const totalFbViews = rawData.facebook_posts.reduce((acc, r) => acc + (r.views || 0), 0);

  renderChart('chart-q89', {
    type: 'doughnut',
    data: {
      labels: [
        'Website (Lượt xem trang)',
        'TikTok (Lượt xem nội dung)',
        'Facebook (Lượt xem bài viết)'
      ],
      datasets: [{
        data: [totalWebViews, totalTtViews, totalFbViews],
        backgroundColor: ['#2563eb', '#0f172a', '#1877f2'],
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const val = ctx.raw || 0;
              const total = totalWebViews + totalTtViews + totalFbViews;
              const pct = (total ? (val / total) * 100 : 0).toFixed(1);
              return `${ctx.label}: ${val.toLocaleString('vi-VN')} (${pct}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });

  renderPlatformKpis('chart-q90');

  // Q91: So sánh hiệu quả Facebook và TikTok (Grouped Bar)
  const fbInteractions = rawData.facebook_posts.reduce((acc, r) => acc + (r.interactions || 0), 0);
  const ttInteractions = rawData.tiktok_content.reduce((acc, r) => acc + (r.interactions_reported || 0), 0);

  renderChart('chart-q91', {
    type: 'bar',
    data: {
      labels: ['Facebook', 'TikTok'],
      datasets: [
        {
          label: 'Tổng lượt xem (Views)',
          data: [totalFbViews, totalTtViews],
          backgroundColor: '#3b82f6',
          borderRadius: 6
        },
        {
          label: 'Tổng tương tác (Interactions)',
          data: [fbInteractions, ttInteractions],
          backgroundColor: '#f59e0b',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true },
        x: { grid: { display: false } }
      }
    }
  });
}

// ==========================================
// TAB 2: WEBSITE GA4 (8 CARDS)
// ==========================================
function renderTab2() {
  renderTab2KPIs();
  renderTab2Charts();
}

function renderTab2KPIs() {
  const daily = getFilteredWebsiteDaily();
  const totalDays = daily.length || 1;
  const totalUsersSum = daily.reduce((acc, r) => acc + (r.active_users || 0), 0);
  const avgUsers = (totalUsersSum / totalDays).toFixed(1);

  const totalSessions = daily.reduce((acc, r) => acc + (r.sessions || 0), 0);
  const totalViews = daily.reduce((acc, r) => acc + (r.page_views || 0), 0);
  const viewsPerSession = totalSessions > 0 ? (totalViews / totalSessions).toFixed(2) : '0.00';

  // Q92
  const elQ92 = document.getElementById('kpi-q92');
  if (elQ92) elQ92.innerText = avgUsers;

  // Q93
  const elQ93 = document.getElementById('kpi-q93');
  if (elQ93) elQ93.innerText = viewsPerSession;
}

function renderTab2Charts() {
  const daily = getFilteredWebsiteDaily();

  // Q94: Nhịp độ người dùng và phiên truy cập theo ngày
  renderChart('chart-q94', {
    type: 'line',
    data: {
      labels: daily.map(d => formatDate(d.date)),
      datasets: [
        {
          label: 'Phiên · GA4',
          data: daily.map(d => d.sessions),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Người dùng hoạt động · GA4',
          data: daily.map(d => d.active_users),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        ...estimateTrendDatasets(daily, ['sessions', 'active_users'])
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true },
        x: { grid: { display: false } }
      }
    }
  });

  renderTrafficSources(daily);

  // Q96: Top 10 trang được truy cập nhiều nhất (Horizontal Bar)
  const pages = rawData.page_details || [];
  renderChart('chart-q96', {
    type: 'bar',
    data: {
      labels: pages.map(p => `${p.title} (${p.path})`),
      datasets: [{
        label: 'Lượt xem trang (Views)',
        data: pages.map(p => p.views),
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });

  // Q97: Phân bổ sự kiện Website Events (Bar)
  const events = rawData.website_events || [];
  renderChart('chart-q97', {
    type: 'bar',
    data: {
      labels: events.map(e => e.name),
      datasets: [{
        label: 'Lượt kích hoạt',
        data: events.map(e => e.count),
        backgroundColor: '#0284c7',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Q98: Các sự kiện chuyển đổi chính (Bar)
  const convs = rawData.conversions || [];
  renderChart('chart-q98', {
    type: 'bar',
    data: {
      labels: convs.map(c => c.name),
      datasets: [{
        label: 'Lượt chuyển đổi',
        data: convs.map(c => c.count),
        backgroundColor: '#10b981',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Q99: Tỷ lệ thoát theo Trang đích (Horizontal Bar)
  const landings = rawData.landing_pages || [];
  renderChart('chart-q99', {
    type: 'bar',
    data: {
      labels: landings.map(l => l.path),
      datasets: [{
        label: 'Tỷ lệ thoát (Bounce Rate %)',
        data: landings.map(l => l.bounce),
        backgroundColor: '#f59e0b',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
    }
  });
}

function renderTrafficSources(daily) {
  // Q95: Cơ cấu nguồn truy cập Website (Donut)
  const historical = rawData.website_daily.filter(row => row.date < '2026-11-18');
  const days = new Set(daily.map(row => row.date));
  const fullHistory = historical.length > 0 && historical.every(row => days.has(row.date));
  const totals = new Map();
  function addSource(source, medium, sessions) {
    const label = `${source} / ${medium}`;
    totals.set(label, (totals.get(label) || 0) + sessions);
  }
  const estimate = document.getElementById('traffic-data-mode').value === 'estimate';
  const sourceNote = document.getElementById('traffic-sources-scope');
  if (estimate) {
    const scenario = window.CHAM_DI_SAN_TRAFFIC_SCENARIO;
    const selected = (scenario?.rows || []).filter(row => days.has(row.date));
    for (const row of selected) addSource(row.session_source, row.session_medium, row.sessions);
    const sessions = selected.reduce((total, row) => total + row.sessions, 0);
    sourceNote.textContent = selected.length
      ? `20–24/11/2026 · ${displayNumber(sessions)} phiên ước tính theo bộ lọc`
      : 'Kịch bản ước tính chỉ có dữ liệu từ 20 đến 24/11/2026.';
  } else {
    const historicalSources = fullHistory ? (rawData.traffic_sources || []) : [];
    for (const row of historicalSources) addSource(row.source, row.medium, row.sessions);
    const apiSources = (rawData.ga4_sources_live || []).filter(row => days.has(row.date));
    for (const row of apiSources) addSource(row.session_source, row.session_medium, row.sessions);
    if (!totals.size) {
      sourceNote.textContent = 'Không có số liệu nguồn truy cập GA4 cho khoảng ngày đã chọn.';
    } else if (!fullHistory && historical.some(row => days.has(row.date))) {
      sourceNote.textContent = 'Biểu đồ chỉ hiển thị phần GA4 có số liệu nguồn theo ngày.';
    } else {
      sourceNote.textContent = '';
    }
  }
  sourceNote.hidden = !sourceNote.textContent;
  const sources = [...totals].sort((a, b) => b[1] - a[1]);
  renderChart('chart-q95', {
    type: 'doughnut',
    data: {
      labels: sources.map(([label]) => label),
      datasets: [{
        label: estimate ? 'Phiên ước tính' : 'Phiên thực tế',
        data: sources.map(([, sessions]) => sessions),
        backgroundColor: [
          '#2563eb', '#38bdf8', '#34d399', '#fbbf24',
          '#f87171', '#a78bfa', '#f472b6', '#94a3b8'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
      },
      cutout: '60%'
    }
  });
}

// ==========================================
// TAB 3: FACEBOOK (6 CARDS)
// ==========================================
function renderTab3() {
  const posts = rawData.facebook_posts || [];

  // Q100
  const elQ100 = document.getElementById('kpi-q100');
  if (elQ100) elQ100.innerText = posts.length.toLocaleString('vi-VN');

  // Q101
  const totalClicks = posts.reduce((acc, r) => acc + (r.link_clicks || 0), 0);
  const elQ101 = document.getElementById('kpi-q101');
  if (elQ101) elQ101.innerText = totalClicks.toLocaleString('vi-VN');

  // Q102: Top 10 bài viết theo lượt xem
  const topViews = [...posts].sort((a, b) => b.views - a.views).slice(0, 10);
  renderChart('chart-q102', {
    type: 'bar',
    data: {
      labels: topViews.map(p => truncateText(p.post_title, 35)),
      datasets: [{
        label: 'Lượt xem (Views)',
        data: topViews.map(p => p.views),
        backgroundColor: '#1877f2',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });

  // Q103: Top 10 bài viết theo click liên kết
  const topClicks = [...posts].sort((a, b) => b.link_clicks - a.link_clicks).slice(0, 10);
  renderChart('chart-q103', {
    type: 'bar',
    data: {
      labels: topClicks.map(p => truncateText(p.post_title, 35)),
      datasets: [{
        label: 'Lượt nhấp liên kết (Clicks)',
        data: topClicks.map(p => p.link_clicks),
        backgroundColor: '#0284c7',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });

  // Q104: Phân bổ tương tác và chia sẻ theo bài viết (Stacked Bar)
  renderChart('chart-q104', {
    type: 'bar',
    data: {
      labels: posts.map((p, i) => `Bài ${i+1}`),
      datasets: [
        {
          label: 'Tương tác',
          data: posts.map(p => p.interactions),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        },
        {
          label: 'Lượt chia sẻ',
          data: posts.map(p => p.shares),
          backgroundColor: '#10b981',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });

  // Q105: Xu hướng lượt xem và tương tác theo thời gian
  renderChart('chart-q105', {
    type: 'line',
    data: {
      labels: posts.map(p => formatDate(p.date)),
      datasets: [
        {
          label: 'Lượt xem bài viết',
          data: posts.map(p => p.views),
          borderColor: '#1877f2',
          backgroundColor: 'rgba(24, 119, 242, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Lượt tương tác',
          data: posts.map(p => p.interactions),
          borderColor: '#f59e0b',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ==========================================
// TAB 4: TIKTOK (6 CARDS)
// ==========================================
function renderTab4() {
  const items = rawData.tiktok_content || [];
  const videos = items.filter(v => v.post_type === 'Video');

  // Q106: Lượt xem TB / video (478)
  const totalVideoViews = videos.reduce((acc, r) => acc + (r.views || 0), 0);
  const avgVideoViews = Math.round(totalVideoViews / (videos.length || 1));
  const elQ106 = document.getElementById('kpi-q106');
  if (elQ106) elQ106.innerText = avgVideoViews.toLocaleString('vi-VN');

  // Q107: Tỷ lệ tương tác ER TikTok (3.69%)
  const totalViews = items.reduce((acc, r) => acc + (r.views || 0), 0);
  const totalInteractions = items.reduce((acc, r) => acc + (r.interactions_reported || 0), 0);
  const erPct = ((totalInteractions / totalViews) * 100).toFixed(2);
  const elQ107 = document.getElementById('kpi-q107');
  if (elQ107) elQ107.innerText = `${erPct}%`;

  // Q108: Xếp hạng video TikTok theo lượt xem (Horizontal Bar)
  const sortedByViews = [...videos].sort((a, b) => b.views - a.views);
  renderChart('chart-q108', {
    type: 'bar',
    data: {
      labels: sortedByViews.map(v => truncateText(v.post_title, 35)),
      datasets: [{
        label: 'Lượt xem (Views)',
        data: sortedByViews.map(v => v.views),
        backgroundColor: '#0f172a',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });

  // Q110: Tỷ trọng các loại tương tác trên TikTok (Donut: Likes 137, Saves 3, Comments 1, Shares 9)
  const totalLikes = items.reduce((acc, r) => acc + (r.likes || 0), 0);
  const totalSaves = items.reduce((acc, r) => acc + (r.saves || 0), 0);
  const totalComments = items.reduce((acc, r) => acc + (r.comments || 0), 0);
  const totalShares = items.reduce((acc, r) => acc + (r.shares || 0), 0);

  renderChart('chart-q110', {
    type: 'doughnut',
    data: {
      labels: [
        `Lượt thích (${totalLikes})`,
        `Lượt lưu (${totalSaves})`,
        `Bình luận (${totalComments})`,
        `Lượt chia sẻ (${totalShares})`
      ],
      datasets: [{
        data: [totalLikes, totalSaves, totalComments, totalShares],
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      cutout: '60%'
    }
  });

  // Q109: Cơ cấu 4 hành vi tương tác trên từng video TikTok (Stacked Bar)
  renderChart('chart-q109', {
    type: 'bar',
    data: {
      labels: videos.map((_, i) => `Video ${i+1}`),
      datasets: [
        { label: 'Thích (Likes)', data: videos.map(v => v.likes), backgroundColor: '#ef4444' },
        { label: 'Lưu (Saves)', data: videos.map(v => v.saves), backgroundColor: '#f59e0b' },
        { label: 'Bình luận', data: videos.map(v => v.comments), backgroundColor: '#3b82f6' },
        { label: 'Chia sẻ', data: videos.map(v => v.shares), backgroundColor: '#10b981' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });

  // Q111: Thời lượng video (giây) và Lượt xem thực tế
  renderChart('chart-q111', {
    type: 'bar',
    data: {
      labels: videos.map((_, i) => `Video ${i+1}`),
      datasets: [
        {
          label: 'Lượt xem (Views)',
          data: videos.map(v => v.views),
          backgroundColor: '#0f172a',
          yAxisID: 'y'
        },
        {
          label: 'Thời lượng (Giây)',
          data: videos.map(v => v.duration_seconds > 0 ? v.duration_seconds : null),
          type: 'line',
          showLine: false,
          pointRadius: 4,
          borderColor: '#06b6d4',
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { type: 'linear', position: 'left', beginAtZero: true },
        y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { display: false } }
      }
    }
  });
}

// ==========================================
// TAB 5: ĐÁNH GIÁ KPI (6 CARDS)
// ==========================================
function renderPlatformKpis(canvasId, horizontal = false) {
  const kpis = rawData.kpi_results || [];
  const platforms = [
    { key: 'WEBSITE', label: 'Website', color: '#2563eb' },
    { key: 'FACEBOOK', label: 'Facebook', color: '#1877f2' },
    { key: 'TIKTOK', label: 'TikTok', color: '#0f172a' }
  ];
  const averages = platforms.map(platform => {
    const rows = kpis.filter(row => row.platform === platform.key);
    return averageAchievement(rows);
  });
  renderChart(canvasId, {
    type: 'bar',
    data: {
      labels: platforms.map(platform => platform.label),
      datasets: [{
        label: 'Tỷ lệ hoàn thành trung bình',
        data: averages,
        backgroundColor: platforms.map(platform => platform.color),
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: context => displayPercent(context.raw) } }
      },
      scales: {
        [horizontal ? 'x' : 'y']: {
          beginAtZero: true, suggestedMax: 100, ticks: { callback: value => value + '%' }
        }
      }
    }
  });
}

function averageAchievement(rows) {
  const verified = rows.filter(row => Number.isFinite(row.achievement_pct));
  if (!verified.length) return null;
  return verified.reduce((sum, row) => sum + row.achievement_pct, 0) / verified.length;
}

function formatPercent(value) {
  return value.toLocaleString('vi-VN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }) + '%';
}

function displayPercent(value) {
  return Number.isFinite(value) ? formatPercent(value) : '–';
}

function displayNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('vi-VN') : '–';
}

function renderTab5() {
  const kpis = rawData.kpi_results || [];

  // Q112: Tỷ lệ hoàn thành trung bình
  const elQ112 = document.getElementById('kpi-q112');
  if (elQ112) elQ112.innerText = displayPercent(averageAchievement(kpis));

  // Q113: Số KPI đạt mục tiêu
  const metCount = kpis.filter(k => k.status === 'DAT').length;
  const elQ113 = document.getElementById('kpi-q113');
  if (elQ113) elQ113.innerText = `${metCount} / ${kpis.length}`;

  // Q114: Tỷ lệ hoàn thành từng chỉ số KPI (%) (Horizontal Bar)
  renderChart('chart-q114', {
    type: 'bar',
    data: {
      labels: kpis.map(k => `[${k.code}] ${k.metric}`),
      datasets: [{
        label: 'Tỷ lệ đạt mục tiêu (%)',
        data: kpis.map(k => k.achievement_pct),
        backgroundColor: kpis.map(k => k.status === 'DAT' ? '#10b981' : '#ef4444'),
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, suggestedMax: 100, ticks: { callback: v => v + '%' } } }
    }
  });

  renderPlatformKpis('chart-q117', true);

  // Q115: Đối chiếu Mục tiêu (100%) vs Thực tế (%) từng KPI
  renderChart('chart-q115', {
    type: 'bar',
    data: {
      labels: kpis.map(k => k.code),
      datasets: [
        {
          label: 'Ngưỡng đạt (90%)',
          data: kpis.map(() => rawData.metadata.kpi_review?.threshold_pct ?? 100),
          backgroundColor: '#e2e8f0'
        },
        {
          label: 'Thực tế đạt (%)',
          data: kpis.map(k => k.achievement_pct),
          backgroundColor: '#2563eb'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, suggestedMax: 100, ticks: { callback: v => v + '%' } } }
    }
  });

  // Q116: Khoảng cách chênh lệch cần bù đắp (Minimum Gap)
  renderChart('chart-q116', {
    type: 'bar',
    data: {
      labels: kpis.map(k => `${k.code} (${k.unit})`),
      datasets: [{
        label: 'Khoảng cách tối thiểu cần bù đắp',
        data: kpis.map(k => k.minimum_gap),
        backgroundColor: '#f59e0b',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });

  // Render KPI Table Summary
  renderKpiTable(kpis);
}

function renderKpiTable(kpis) {
  const tbody = document.getElementById('kpi-table-body');
  if (!tbody) return;
  const statusLabel = { DAT: 'Đạt', CHUA_DAT: 'Chưa đạt', CHUA_XAC_MINH: 'Chưa xác minh' };
  tbody.innerHTML = kpis.map(k => `
    <tr>
      <td><strong>${k.code}</strong></td>
      <td><span class="badge-status status-chua-dat">${k.platform}</span></td>
      <td>${k.metric}</td>
      <td>${displayNumber(k.original_target)} ${k.unit}</td>
      <td><strong>${displayNumber(k.target)}</strong> ${k.unit}</td>
      <td>${Number.isFinite(k.result) ? displayNumber(k.result) + ' ' + k.unit : 'Chưa xác minh'}</td>
      <td>${displayPercent(k.original_achievement_pct)}</td>
      <td><strong>${displayPercent(k.achievement_pct)}</strong></td>
      <td><span class="badge-status ${k.status === 'DAT' ? 'status-dat' : 'status-chua-dat'}">${statusLabel[k.status] || k.status}</span></td>
      <td>${displayNumber(k.minimum_gap)}</td>
      <td style="font-size:0.75rem; color:#64748b;">${k.note || ''}</td>
    </tr>
  `).join('');
}

// Chart Render Helper
function renderChart(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }
  charts[canvasId] = new Chart(ctx, config);
}

// Format Date YYYY-MM-DD -> DD/MM
function formatDate(dStr) {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dStr;
}

function truncateText(str, maxLen = 30) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}
