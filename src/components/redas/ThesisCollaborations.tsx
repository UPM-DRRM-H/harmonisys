import { useEffect, useState } from 'react';
import { Collaboration } from '@/types';

const ThesisCollaborations = () => {
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/redas?sheetName=Thesis Collaborations')
            .then((res) => {
                if (!res.ok) throw new Error('Source unavailable');
                return res.json();
            })
            .then((data) => {
                if (!Array.isArray(data)) throw new Error('Invalid dataset');
                setCollaborations(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch collaborations');
                setLoading(false);
            });
    }, []);

    return (
        <div className="h-72 overflow-y-auto border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50/60 via-sky-50/50 to-slate-50/40 backdrop-blur-sm">
            {loading ? (
                <div className="text-center text-slate-500">Loading...</div>
            ) : error ? (
                <div className="text-center text-red-500">{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collaborations.length > 0 ? (
                        collaborations.map((collab, index) => (
                            <div
                                key={index}
                                className="bg-white/85 backdrop-blur-sm p-4 rounded-xl border border-blue-100 space-y-2 hover:shadow-md transition-all duration-300 hover:bg-white/95"
                            >
                                <p className="font-semibold text-blue-900 text-sm">
                                    {collab.school}
                                </p>
                                <p className="text-xs text-sky-700">
                                    {collab.department}
                                </p>
                                <p className="text-xs text-slate-600">
                                    {collab.degreeCourse}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-500 col-span-full">
                            No collaborations found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ThesisCollaborations;
