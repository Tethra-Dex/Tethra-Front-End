import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'main';

    // Main view
    if (view === 'main') {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#0B1017',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 'bold',
                  color: '#60a5fa',
                  marginBottom: '20px',
                }}
              >
                TethraDEX
              </div>
              <div
                style={{
                  fontSize: '32px',
                  color: '#94a3b8',
                  marginBottom: '40px',
                }}
              >
                Decentralized Trading Platform
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  marginTop: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    border: '2px solid #3b82f6',
                    borderRadius: '12px',
                    padding: '24px',
                    width: '250px',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    📊
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    Advanced Charts
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    border: '2px solid #8b5cf6',
                    borderRadius: '12px',
                    padding: '24px',
                    width: '250px',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    💰
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    Free USDC
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(34, 211, 238, 0.2)',
                  border: '2px solid #22d3ee',
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '30px',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    color: '#22d3ee',
                    fontWeight: '600',
                  }}
                >
                  🚀 Start Trading Now
                </div>
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Chart view - Dynamic with coin selection
    if (view === 'chart') {
      const coin = searchParams.get('coin') || 'BTC';
      const timeframe = searchParams.get('timeframe') || '1D';

      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#0B1017',
              padding: '20px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: coin === 'BTC' ? '#f7931a' : '#627eea',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  {coin === 'BTC' ? 'B' : 'E'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: '32px',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  >
                    {coin}/USD
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: '20px',
                      color: '#22c55e',
                    }}
                  >
                    {coin === 'BTC' ? '$95,234.50' : '$3,456.78'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      timeframe === '1H' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '18px',
                    color: 'white',
                  }}
                >
                  1H
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      timeframe === '1D' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '18px',
                    color: 'white',
                  }}
                >
                  1D
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      timeframe === '1W' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '18px',
                    color: 'white',
                  }}
                >
                  1W
                </div>
              </div>
            </div>

            {/* Chart Area - Simulated candlestick */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                backgroundColor: '#16191E',
                borderRadius: '12px',
                padding: '20px',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                gap: '8px',
              }}
            >
              {/* Simple bar chart representation */}
              <div style={{ display: 'flex', width: '60px', height: '320px', backgroundColor: '#22c55e', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '240px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '340px', backgroundColor: '#22c55e', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '280px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '360px', backgroundColor: '#22c55e', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '300px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '380px', backgroundColor: '#22c55e', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '340px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '400px', backgroundColor: '#22c55e', borderRadius: '4px' }} />
              <div style={{ display: 'flex', width: '60px', height: '360px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '30px',
                marginTop: '20px',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: '16px', color: '#94a3b8' }}>
                  24h High
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '20px',
                    color: '#22c55e',
                    fontWeight: '600',
                  }}
                >
                  ${coin === 'BTC' ? '96,542' : '3,521'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: '16px', color: '#94a3b8' }}>
                  24h Low
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '20px',
                    color: '#ef4444',
                    fontWeight: '600',
                  }}
                >
                  ${coin === 'BTC' ? '93,128' : '3,389'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: '16px', color: '#94a3b8' }}>
                  24h Volume
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '20px',
                    color: 'white',
                    fontWeight: '600',
                  }}
                >
                  ${coin === 'BTC' ? '28.5B' : '12.3B'}
                </div>
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Connect view
    if (view === 'connect') {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#0B1017',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔗</div>
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '20px',
                }}
              >
                Connect Your Wallet
              </div>
              <div
                style={{
                  fontSize: '28px',
                  color: '#94a3b8',
                  marginBottom: '40px',
                  maxWidth: '800px',
                }}
              >
                Powered by Privy - Email, Social & Web3 Wallets
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    border: '2px solid #8b5cf6',
                    borderRadius: '12px',
                    padding: '24px 80px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '28px',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    ✅ Embedded Wallets
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: 'rgba(34, 211, 238, 0.2)',
                    border: '2px solid #22d3ee',
                    borderRadius: '12px',
                    padding: '24px 80px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '28px',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    ✅ Social Login
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Claim view
    if (view === 'claim') {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#0B1017',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>💰</div>
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '20px',
                }}
              >
                Claim Free USDC
              </div>
              <div
                style={{
                  fontSize: '28px',
                  color: '#94a3b8',
                  marginBottom: '40px',
                  maxWidth: '800px',
                }}
              >
                Get 100 USDC to start trading - One claim per wallet
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: '#22c55e',
                  borderRadius: '16px',
                  padding: '40px 80px',
                  marginTop: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '64px',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  100 USDC
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    color: 'white',
                    marginTop: '10px',
                  }}
                >
                  Available to Claim
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '24px',
                  color: '#f59e0b',
                  marginTop: '30px',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  padding: '16px 32px',
                  borderRadius: '8px',
                }}
              >
                ⚡ Instant claim - No waiting
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Coins view
    if (view === 'coins') {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#0B1017',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>🪙</div>
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '20px',
                }}
              >
                Available Markets
              </div>
              <div
                style={{
                  fontSize: '28px',
                  color: '#94a3b8',
                  marginBottom: '40px',
                }}
              >
                Trade popular crypto pairs
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '30px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'rgba(247, 147, 26, 0.2)',
                    border: '3px solid #f7931a',
                    borderRadius: '12px',
                    padding: '30px 50px',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    ₿
                  </div>
                  <div
                    style={{
                      fontSize: '32px',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    BTC/USD
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'rgba(98, 126, 234, 0.2)',
                    border: '3px solid #627eea',
                    borderRadius: '12px',
                    padding: '30px 50px',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    Ξ
                  </div>
                  <div
                    style={{
                      fontSize: '32px',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    ETH/USD
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  border: '2px solid #3b82f6',
                  borderRadius: '12px',
                  padding: '20px 40px',
                  marginTop: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    color: '#60a5fa',
                    fontWeight: '600',
                  }}
                >
                  + More markets coming soon
                </div>
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Default/fallback view
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0B1017',
          }}
        >
          <div
            style={{ fontSize: '72px', color: '#60a5fa', fontWeight: 'bold' }}
          >
            TethraDEX
          </div>
          <div style={{ fontSize: '32px', color: '#94a3b8', marginTop: '20px' }}>
            Decentralized Trading Platform
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Image generation error:', error);

    // Return simple fallback image
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0B1017',
          }}
        >
          <div
            style={{ fontSize: '64px', color: 'white', fontWeight: 'bold' }}
          >
            TethraDEX
          </div>
          <div style={{ fontSize: '32px', color: '#94a3b8', marginTop: '20px' }}>
            Error Loading Image
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
