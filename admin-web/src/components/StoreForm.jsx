import { useState, useEffect, useRef, useCallback } from 'react';

function StoreForm({ supabase, session }) {
  const [storeName, setStoreName] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  // handleMapClick을 먼저 정의
  const handleMapClick = useCallback((e) => {
    const latlng = e.latLng;
    const lat = latlng.getLat();
    const lng = latlng.getLng();

    setSelectedLocation({ lat, lng });

    if (markerRef.current) {
      markerRef.current.setPosition(latlng);
    } else if (mapInstanceRef.current) {
      markerRef.current = new window.kakao.maps.Marker({
        position: latlng,
        map: mapInstanceRef.current,
      });
    }

    if (geocoderRef.current) {
      geocoderRef.current.coord2Address(lng, lat, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const addr = result[0].address.address_name;
          setAddress(addr);
        }
      });
    }
  }, []);

  useEffect(() => {
    // DOM이 마운트된 후 실행되도록 약간의 지연
    const timer = setTimeout(() => {
      if (!mapRef.current) {
        console.warn('mapRef가 아직 준비되지 않았습니다');
        return;
      }

      const initMapAndGeocoder = () => {
        if (!mapRef.current) return;

        try {
          initMap();
          initGeocoder();

          // 지도 클릭 이벤트 등록
          if (mapInstanceRef.current) {
            window.kakao.maps.event.addListener(
              mapInstanceRef.current,
              'click',
              handleMapClick
            );
          }
        } catch (error) {
          console.error('지도 초기화 오류:', error);
        }
      };

      // 카카오 지도 API 로드 확인 및 초기화
      const loadKakaoMap = () => {
        // 이미 완전히 로드된 경우
        if (window.kakao?.maps?.Map) {
          initMapAndGeocoder();
          return;
        }

        // 스크립트가 아직 로드되지 않은 경우 - 대기
        let attempts = 0;
        const maxAttempts = 200; // 20초

        const checkKakao = setInterval(() => {
          attempts++;

          // kakao 객체와 maps가 모두 준비되었는지 확인
          if (window.kakao?.maps?.Map) {
            clearInterval(checkKakao);
            initMapAndGeocoder();
          }
          // 타임아웃 체크
          else if (attempts >= maxAttempts) {
            clearInterval(checkKakao);
            console.error('카카오 지도 API 로드 실패');
            console.log('디버깅 정보:', {
              kakaoExists: !!window.kakao,
              mapsExists: !!window.kakao?.maps,
              MapExists: !!window.kakao?.maps?.Map,
              scriptTag: document.querySelector(
                'script[src*="dapi.kakao.com"]'
              ),
            });
          }
        }, 100);
      };

      loadKakaoMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [handleMapClick]);

  const initMap = () => {
    if (!mapRef.current) {
      console.error('mapRef.current가 null입니다');
      return;
    }

    const container = mapRef.current;
    if (!container) {
      console.error('컨테이너 요소를 찾을 수 없습니다');
      return;
    }

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.Map) {
      console.error('카카오 지도 API가 로드되지 않았습니다');
      return;
    }

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.978),
      level: 3,
    };

    try {
      mapInstanceRef.current = new window.kakao.maps.Map(container, options);
      console.log('지도 초기화 완료');
    } catch (error) {
      console.error('지도 생성 오류:', error);
    }
  };

  const initGeocoder = () => {
    geocoderRef.current = new window.kakao.maps.services.Geocoder();
  };

  const handleAddressSearch = (query) => {
    setAddress(query);
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (!geocoderRef.current) return;

    geocoderRef.current.addressSearch(query, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSuggestions(result.slice(0, 5));
      } else {
        setSuggestions([]);
      }
    });
  };

  const handleSelectAddress = (item) => {
    const lat = parseFloat(item.y);
    const lng = parseFloat(item.x);
    setAddress(item.address_name);
    setSelectedLocation({ lat, lng });
    setSuggestions([]);

    if (mapInstanceRef.current) {
      const position = new window.kakao.maps.LatLng(lat, lng);
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setLevel(3);

      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new window.kakao.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      alert('지도에서 위치를 선택해주세요.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('stores')
      .insert({
        store_name: storeName,
        greeting_message: greetingMessage,
        address_text: address,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      })
      .select();

    if (error) {
      console.error('Supabase 에러:', error);
      let errorMsg = error.message;
      if (error.message.includes('Could not find the table')) {
        errorMsg +=
          '\n\n해결 방법:\n1. Supabase 대시보드 → SQL Editor\n2. supabase/schema.sql 파일의 내용을 실행\n3. Table Editor에서 stores 테이블이 생성되었는지 확인';
      }
      alert('저장 실패: ' + errorMsg);
    } else {
      alert('저장되었습니다.');
      setStoreName('');
      setGreetingMessage('');
      setAddress('');
      setSelectedLocation(null);
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2>업체 등록</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
          >
            업체명
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
          >
            환영 인사
          </label>
          <textarea
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
            required
            rows="3"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
          >
            주소
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressSearch(e.target.value)}
            placeholder="주소를 입력하거나 지도에서 클릭하세요"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          {suggestions.length > 0 && (
            <ul
              style={{
                listStyle: 'none',
                marginTop: '5px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
              }}
            >
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectAddress(item)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.target.style.background = 'white')}
                >
                  {item.address_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}
          >
            지도
          </label>
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '400px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedLocation}
          style={{
            width: '100%',
            padding: '12px',
            background: loading || !selectedLocation ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !selectedLocation ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  );
}

export default StoreForm;
