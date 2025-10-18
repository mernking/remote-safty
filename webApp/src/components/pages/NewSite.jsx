import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, ArrowLeft, Plus, Map, Navigation } from 'lucide-react';
import { toast } from 'react-toastify';

const NewSite = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Validate coordinates if provided
    if (formData.lat && (isNaN(parseFloat(formData.lat)) || parseFloat(formData.lat) < -90 || parseFloat(formData.lat) > 90)) {
      newErrors.lat = 'Latitude must be a valid number between -90 and 90';
    }

    if (formData.lng && (isNaN(parseFloat(formData.lng)) || parseFloat(formData.lng) < -180 || parseFloat(formData.lng) > 180)) {
      newErrors.lng = 'Longitude must be a valid number between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        }));
        toast.success('Location retrieved successfully');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get current location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const siteData = {
        name: formData.name,
        address: formData.address,
        description: formData.description || null
      };

      // Only include coordinates if both are provided
      if (formData.lat && formData.lng) {
        siteData.lat = parseFloat(formData.lat);
        siteData.lng = parseFloat(formData.lng);
      }

      const response = await fetch('/api/v1/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(siteData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Site created successfully!');
        navigate('/dashboard/sites');
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          toast.error(data.message || 'Failed to create site');
        }
      }
    } catch (error) {
      console.error('Create site error:', error);
      toast.error('Failed to create site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canCreateSite = currentUser?.role === 'ADMIN' || currentUser?.role === 'SAFETY_MANAGER';

  if (!canCreateSite) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Access Denied
        </h3>
        <p className="text-base-content/70">
          You need administrator or safety manager privileges to create sites.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/sites')}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sites
        </button>
        <div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Plus className="w-8 h-8" />
            Add New Site
          </h1>
          <p className="text-base-content/70 mt-2">
            Create a new jobsite location for safety oversight.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-lg">
          <div className="card-body">
            {/* Site Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Site Name *</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter site name"
                className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleInputChange}
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.name}</span>
                </label>
              )}
            </div>

            {/* Address */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Address *</span>
              </label>
              <textarea
                name="address"
                placeholder="Enter full address"
                className={`textarea textarea-bordered h-20 ${errors.address ? 'textarea-error' : ''}`}
                value={formData.address}
                onChange={handleInputChange}
              />
              {errors.address && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.address}</span>
                </label>
              )}
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
              </label>
              <textarea
                name="description"
                placeholder="Optional description of the site"
                className="textarea textarea-bordered h-20"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            {/* Coordinates */}
            <div className="divider">Location Coordinates (Optional)</div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Coordinates
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="btn btn-outline btn-sm flex-1"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Current Location
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Latitude</span>
                </label>
                <input
                  type="number"
                  name="lat"
                  step="0.000001"
                  placeholder="e.g. 40.7128"
                  className={`input input-bordered ${errors.lat ? 'input-error' : ''}`}
                  value={formData.lat}
                  onChange={handleInputChange}
                />
                {errors.lat && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.lat}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Longitude</span>
                </label>
                <input
                  type="number"
                  name="lng"
                  step="0.000001"
                  placeholder="e.g. -74.0060"
                  className={`input input-bordered ${errors.lng ? 'input-error' : ''}`}
                  value={formData.lng}
                  onChange={handleInputChange}
                />
                {errors.lng && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.lng}</span>
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/sites')}
                className="btn btn-ghost"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading loading-spinner loading-sm"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Site
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSite;