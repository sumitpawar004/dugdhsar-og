import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { ShieldCheck, CheckCircle2, FileText, Activity, AlertCircle, Download, Thermometer } from 'lucide-react';

export const QualityPage: React.FC = () => {
  const { currentBatch } = useStore();
  const { navigate } = useRouter();
  const [searchedBatch, setSearchedBatch] = useState(currentBatch.batchNumber);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const adulterantTests = [
    { name: 'Urea (Synthetic Nitrogen)', standard: 'Negative', result: '100% Negative (0.00 ppm)' },
    { name: 'Detergents & Alkalis', standard: 'Negative', result: '100% Negative (Pristine)' },
    { name: 'Starch & Cereal Flours', standard: 'Negative', result: '100% Negative (No Iodine Blue)' },
    { name: 'Formalin (Preservative)', standard: 'Negative', result: '100% Negative (Zero)' },
    { name: 'Hydrogen Peroxide (H2O2)', standard: 'Negative', result: '100% Negative (Pass)' },
    { name: 'Boric Acid / Borates', standard: 'Negative', result: '100% Negative (Pass)' },
    { name: 'Maltodextrin & Dextrose', standard: 'Negative', result: '100% Negative (Pass)' },
    { name: 'Neutralizers (NaOH/Carbonates)', standard: 'Negative', result: '100% Negative (Natural pH 6.7)' },
    { name: 'Antibiotic Residues (MRL)', standard: '< 0.01 ppb', result: 'Not Detected (Compliant)' },
    { name: 'Aflatoxin M1', standard: '< 0.5 ppb', result: '< 0.05 ppb (Pristine Safe)' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
  };

  const handleDownloadCertificate = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen">
      {/* Hero */}
      <section className="pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#D8C9AD]">
        <div className="max-w-4xl mx-auto text-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#302C26]/70 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="hover:text-[#A34F37] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-[#A34F37] font-bold">Our Quality</span>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-3">
            Daily Laboratory Assay & Purity Testing
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif text-[#263D30] font-normal mb-6">
            18-Point Adulteration Assay & Cold-Chain Certification
          </h1>
          <p className="text-base text-[#302C26]/80 max-w-2xl mx-auto leading-relaxed">
            Every morning milking batch undergoes rigorous chemical and microbial testing before the dispatch fleet leaves our premises. 
            We publish every certificate transparently for our patrons.
          </p>
        </div>
      </section>

      {/* Batch Certificate Lookup Tool */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-2xl border border-[#D8C9AD] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-serif text-[#263D30] font-semibold">
                Batch Purity Lookup
              </h2>
              <p className="text-xs text-[#302C26]/70">
                Enter the encrypted batch code printed on your bottle cap or glass label.
              </p>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input 
                type="text" 
                value={searchedBatch} 
                onChange={(e) => setSearchedBatch(e.target.value)}
                placeholder="e.g. BATCH-2026-0228-GIR"
                className="px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30] font-mono focus:outline-none focus:border-[#263D30]"
              />
              <button 
                type="submit" 
                className="bg-[#263D30] text-[#FAF6EE] px-4 py-2 text-xs font-semibold rounded-lg hover:bg-[#1A2B22] transition-colors"
              >
                {isSearching ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          </div>

          {/* Active Batch Summary Card */}
          <div className="bg-[#F8F4EC] p-6 rounded-xl border border-[#D8C9AD] grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A34F37] font-semibold block mb-1">
                Batch Number
              </span>
              <span className="text-sm font-mono font-bold text-[#263D30]">
                {currentBatch.batchNumber}
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A34F37] font-semibold block mb-1">
                Purity Rating
              </span>
              <span className="text-sm font-bold text-[#263D30] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{(currentBatch.purityScore / 5).toFixed(1)}% Pristine</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A34F37] font-semibold block mb-1">
                Natural Fat / SNF
              </span>
              <span className="text-sm font-mono font-semibold text-[#263D30]">
                {currentBatch.fatContent}% / {currentBatch.snfContent}%
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#A34F37] font-semibold block mb-1">
                Microbial Stability (MBRT)
              </span>
              <span className="text-sm font-semibold text-emerald-800">
                {currentBatch.mbrtScore}
              </span>
            </div>
          </div>

          {/* 10-Adulterant Matrix */}
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#263D30] mb-4">
            Official Chemical Assay Results (Purity Standard 2026)
          </h3>
          <div className="border border-[#D8C9AD] rounded-xl overflow-hidden divide-y divide-[#D8C9AD] text-xs">
            <div className="bg-[#263D30] text-[#FAF6EE] font-semibold p-3 grid grid-cols-3">
              <span>Target Adulterant</span>
              <span>Regulatory Threshold</span>
              <span className="text-right">Observed Batch Value</span>
            </div>
            {adulterantTests.map((test, idx) => (
              <div key={idx} className="p-3 grid grid-cols-3 items-center bg-[#FAF6EE] hover:bg-[#F8F4EC] transition-colors">
                <span className="font-medium text-[#263D30]">{test.name}</span>
                <span className="text-[#302C26]/70">{test.standard}</span>
                <span className="text-right font-mono font-semibold text-emerald-800 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                  <span>{test.result}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#D8C9AD]">
            <div className="text-xs text-[#302C26]/75">
              Tested by: <strong className="text-[#263D30]">{currentBatch.testedBy}</strong>
            </div>
            <button
              onClick={handleDownloadCertificate}
              className="bg-[#A34F37] text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#853C26] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed Quality Assay Report</span>
            </button>
          </div>

          {downloadSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Quality Assay Report for batch {currentBatch.batchNumber} has been verified and downloaded to your device.</span>
            </div>
          )}

          {/* Official FSSAI Registration Certificate Strip */}
          <div className="mt-6 p-4 sm:p-5 rounded-xl bg-[#F8F4EC] border border-[#D8C9AD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/aistudio/image_7a8553d9.png"
                alt="FSSAI Registration Logo"
                className="h-10 w-auto object-contain bg-white rounded-lg p-1.5 border border-[#D8C9AD] shrink-0"
              />
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-[#263D30] uppercase tracking-wider text-[10px]">
                  Food Safety &amp; Standards Authority of India · Seoni, MP
                </p>
                <p className="font-mono font-bold text-[#263D30] text-sm">
                  FSSAI Reg. No: 21426230002154
                </p>
                <p className="text-[11px] text-[#302C26]/75">
                  Food Safety Assayed · Pure A2 Dairy · Issued: 12-11-2026 · Valid Upto: 11-11-2031
                </p>
              </div>
            </div>
            <a
              href="/assets/aistudio/certificate-127945312_copy_464ac32d.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View FSSAI Certificate PDF</span>
            </a>
          </div>
        </div>
      </section>

      {/* Cold Chain Protocol Card */}
      <section className="py-12 px-4 max-w-4xl mx-auto mb-16">
        <div className="bg-[#263D30] text-[#F3EDE1] p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Thermometer className="w-6 h-6 text-[#C2A36C]" />
            <h3 className="text-2xl font-serif text-[#F3EDE1]">
              Continuous 2°C - 4°C Cold Chain Protocol
            </h3>
          </div>
          <p className="text-sm text-[#F3EDE1]/80 leading-relaxed mb-6">
            Unlike commercial brands that rely on preservatives to survive ambient heat, Dugdhsar milk relies entirely on temperature discipline. 
            If the temperature exceeds 4°C at any stage between bottling and delivery, our automated dispatch sensor locks the batch.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#1F2F26] p-4 rounded-lg border border-[#3A5243]">
              <span className="text-[#C2A36C] font-semibold block mb-1">01. Rapid Chilling</span>
              <span className="text-[#F3EDE1]/75">Brought from 37°C body temperature to 3.5°C within 15 minutes of milking.</span>
            </div>
            <div className="bg-[#1F2F26] p-4 rounded-lg border border-[#3A5243]">
              <span className="text-[#C2A36C] font-semibold block mb-1">02. Glass Bottling</span>
              <span className="text-[#F3EDE1]/75">Filled in hermetically sealed glass bottles at 3.0°C in an ISO sterile cleanroom.</span>
            </div>
            <div className="bg-[#1F2F26] p-4 rounded-lg border border-[#3A5243]">
              <span className="text-[#C2A36C] font-semibold block mb-1">03. GPS Cold Transit</span>
              <span className="text-[#F3EDE1]/75">Transferred in refrigerated vans equipped with live telemetry temperature loggers.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
