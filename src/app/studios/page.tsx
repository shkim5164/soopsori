"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";

interface Studio {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StudiosPage() {
  const { data: session } = useSession();
  const { data: studios, error, mutate } = useSWR<Studio[]>("/api/studios", fetcher);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Initialize map
    if (!mapElement.current || !window.naver || !window.naver.maps) return;

    const mapOptions: naver.maps.MapOptions = {
      center: new window.naver.maps.LatLng(37.5665, 126.9780),
      zoom: 13,
      minZoom: 7,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    };

    const map = new window.naver.maps.Map(mapElement.current, mapOptions);
    mapInstance.current = map;

  }, []);

  useEffect(() => {
    if (!mapInstance.current || !studios || !window.naver || !window.naver.maps) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    studios.forEach(studio => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(studio.latitude, studio.longitude),
        map: mapInstance.current!,
        title: studio.name,
      });

      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 150px; text-align: center;">
            <h4 style="font-weight: bold; margin-bottom: 5px;">${studio.name}</h4>
            <a href="/studios/${studio.id}" style="color: #e83e8c; font-weight: bold; font-size: 12px; text-decoration: underline;">상세보기</a>
          </div>
        `,
        borderWidth: 2,
        borderColor: "#000",
        backgroundColor: "#fff",
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        if (infoWindow.getMap()) {
          infoWindow.close();
        } else {
          infoWindow.open(mapInstance.current!, marker);
        }
      });

      markersRef.current.push(marker);
    });

    if (studios.length > 0 && mapInstance.current) {
      mapInstance.current.setCenter(new window.naver.maps.LatLng(studios[0].latitude, studios[0].longitude));
    }

  }, [studios]);

  const handleAddStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: "", address: "", description: "" });
        mutate();
      } else {
        const err = await res.json();
        alert(err.error || "합주실 추가 실패");
      }
    } catch (error) {
      console.error(error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black font-black flex items-center gap-3">
          <span className="text-4xl">🗺️</span> 합주실 지도
        </h1>
        {session?.user && (
          <button
            onClick={() => setShowAddModal(true)}
            className="neo-btn neo-btn-primary px-4 py-2 font-bold text-sm"
          >
            + 합주실 등록
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh] min-h-[500px]">
        {/* Map Area */}
        <div className="lg:col-span-2 neo-card p-2 h-full">
          <div ref={mapElement} className="w-full h-full border-2 border-black bg-gray-100" />
        </div>

        {/* List Area */}
        <div className="neo-card p-4 overflow-y-auto h-full">
          <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-4">등록된 합주실 ({studios?.length || 0})</h2>
          {error && <p className="text-red-500 font-bold">합주실 목록을 불러오지 못했습니다.</p>}
          {!studios && !error && <p className="font-bold">로딩 중...</p>}
          
          <div className="space-y-3">
            {studios?.map(studio => (
              <Link href={`/studios/${studio.id}`} key={studio.id} className="block group">
                <div className="p-3 bg-white border-2 border-black neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-none transition-all cursor-pointer">
                  <h3 className="font-bold text-lg group-hover:text-neo-pink">{studio.name}</h3>
                  <p className="text-sm text-gray-700 truncate">{studio.address}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-3 border-black border border-2 border-black rounded-none w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b-2 border-black bg-neo-yellow flex justify-between items-center">
              <h2 className="text-xl font-bold text-black font-black">합주실 등록</h2>
              <button onClick={() => setShowAddModal(false)} className="text-black font-black text-xl hover:text-gray-700">×</button>
            </div>
            <form onSubmit={handleAddStudio} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">합주실 이름 *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-black p-2 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">주소 *</label>
                <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border-2 border-black p-2 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">소개</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-black p-2 font-bold" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border-2 border-black font-bold hover:bg-gray-100">취소</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 border-2 border-black font-bold bg-neo-pink text-white hover:bg-pink-600">{submitting ? "등록 중..." : "등록"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
